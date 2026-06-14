const { ImportSession, Anomaly, Expense, ExpenseSplit, Group, GroupMembership, User } = require('../models');
const { sequelize } = require('../models');
const { ApiError, ForbiddenError, NotFoundError } = require('../utils/errors');
const Papa = require('papaparse');
const anomalyDetector = require('../services/anomalyDetector');
const splitEngine = require('../services/splitEngine');
const currencyService = require('../services/currencyService');

const importController = {
  /**
   * Upload and preview CSV import
   * POST /api/groups/:id/import
   */
  uploadCsv: async (req, res, next) => {
    try {
      const { id: groupId } = req.params;
      const userId = req.userId;

      // Verify group membership
      const membership = await GroupMembership.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          left_at: null
        }
      });

      if (!membership) {
        throw new ForbiddenError('Not a member of this group');
      }

      if (!req.file) {
        throw new ApiError('NO_FILE', 'No CSV file uploaded', 400);
      }

      const csvBuffer = req.file.buffer;
      const csvString = csvBuffer.toString('utf-8');

      // Parse CSV
      const parseResult = await new Promise((resolve, reject) => {
        Papa.parse(csvString, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        });
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        throw new ApiError('PARSE_ERROR', 'CSV parsing failed', 400, parseResult.errors);
      }

      const rows = parseResult.data;
      if (!rows || rows.length === 0) {
        throw new ApiError('EMPTY_FILE', 'CSV file is empty', 400);
      }

      // Normalize column names
      const normalizedRows = rows.map(row => normalizeRow(row));

      // Get all group members for validation
      const members = await GroupMembership.findAll({
        where: { group_id: groupId, left_at: null },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      const users = members.map(m => m.user);

      // Detect anomalies
      const anomalies = await anomalyDetector.detectAnomalies(normalizedRows, groupId, users);

      // Create import session
      const importSession = await ImportSession.create({
        group_id: groupId,
        filename: req.file.originalname,
        imported_by: userId,
        status: 'reviewing',
        total_rows: rows.length,
        clean_rows: rows.length - new Set(anomalies.map(a => a.rowNumber)).size,
        anomaly_count: anomalies.length,
        report_json: {
          rows: normalizedRows,
          anomalySummary: anomalyDetector.classifyRows(anomalies, rows.length)
        }
      });

      // Save anomalies
      for (const anomaly of anomalies) {
        await Anomaly.create({
          import_session_id: importSession.id,
          row_number: anomaly.rowNumber,
          anomaly_type: anomaly.anomalyType,
          severity: anomaly.severity,
          description: anomaly.description,
          raw_data: anomaly.rawData,
          suggested_action: anomaly.suggestedAction,
          requires_approval: anomaly.requiresApproval,
          action_taken: 'pending'
        });
      }

      // Preview expenses that would be created
      const previewExpenses = normalizedRows.map((row, index) => {
        const rowAnomalies = anomalies.filter(a => a.rowNumber === index + 1);
        const hasCritical = rowAnomalies.some(a => a.severity === 'critical' || a.severity === 'error');

        return {
          rowNumber: index + 1,
          description: row.description,
          amount: anomalyDetector.parseAmount(row.amount),
          currency: row.currency || 'INR',
          date: row.date || new Date().toISOString().split('T')[0],
          paid_by: row.paid_by || row.payer,
          split_type: row.split_type || 'equal',
          can_import: !hasCritical && !rowAnomalies.find(a => a.anomalyType === 'MISSING_PAYER'),
          anomalies: rowAnomalies.map(a => ({
            type: a.anomalyType,
            severity: a.severity,
            description: a.description
          }))
        };
      });

      res.json({
        importSessionId: importSession.id,
        filename: req.file.originalname,
        totalRows: rows.length,
        summary: anomalyDetector.classifyRows(anomalies, rows.length),
        anomalies: anomalies.map((a, i) => ({
          id: importSession.id + '_' + i,
          rowNumber: a.rowNumber,
          type: a.anomalyType,
          severity: a.severity,
          description: a.description,
          suggestedAction: a.suggestedAction,
          requiresApproval: a.requiresApproval
        })),
        previewExpenses,
        memberList: users.map(u => ({ id: u.id, name: u.name, email: u.email }))
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Anomaly resolution - approve or reject specific rows
   * POST /api/groups/:id/import/:sessionId/anomalies/:anomalyId
   */
  resolveAnomaly: async (req, res, next) => {
    try {
      const { id: groupId, sessionId, anomalyId } = req.params;
      const { action } = req.body; // 'approve', 'reject', 'ignore'
      const userId = req.userId;

      const importSession = await ImportSession.findByPk(sessionId);
      if (!importSession) {
        throw new NotFoundError('Import session');
      }

      if (importSession.group_id !== parseInt(groupId)) {
        throw new ForbiddenError('Import session does not belong to this group');
      }

      const anomaly = await Anomaly.findByPk(anomalyId);
      if (!anomaly || anomaly.import_session_id !== parseInt(sessionId)) {
        throw new NotFoundError('Anomaly');
      }

      await anomaly.update({
        action_taken: action,
        approved_by: action === 'approve' ? userId : null,
        approved_at: action === 'approve' ? new Date() : null
      });

      res.json({
        message: `Anomaly ${action}`,
        anomaly: {
          id: anomaly.id,
          actionTaken: anomaly.action_taken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Confirm and execute the import
   * POST /api/groups/:id/import/:sessionId/confirm
   */
  confirmImport: async (req, res, next) => {
    try {
      const { id: groupId, sessionId } = req.params;
      const { rowSelection, memberMapping } = req.body;
      const userId = req.userId;

      // Verify group membership
      const membership = await GroupMembership.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          left_at: null
        }
      });

      if (!membership) {
        throw new ForbiddenError('Not a member of this group');
      }

      const importSession = await ImportSession.findByPk(sessionId, {
        include: [{
          model: Anomaly,
          as: 'anomalies'
        }]
      });

      if (!importSession) {
        throw new NotFoundError('Import session');
      }

      if (importSession.status === 'completed') {
        throw new ApiError('ALREADY_IMPORTED', 'This import has already been completed', 400);
      }

      const sessionData = importSession.report_json;
      const rows = sessionData.rows;
      const members = await GroupMembership.getActiveMembersAt(groupId, new Date());
      const userMap = anomalyDetector.createUserMap(members.map(m => m.user));

      // Determine which rows to import
      const anomaliesByRow = {};
      (importSession.anomalies || []).forEach(a => {
        if (!anomaliesByRow[a.row_number]) anomaliesByRow[a.row_number] = [];
        anomaliesByRow[a.row_number].push(a);
      });

      const transaction = await sequelize.transaction();

      try {
        const importedExpenses = [];
        const importedSplits = [];
        const currencyConversions = [];
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 1;
          const rowAnomalies = anomaliesByRow[rowNumber] || [];

          // Skip rejected rows
          const isRejected = rowAnomalies.some(
            a => a.action_taken === 'reject' ||
                 (a.severity === 'critical' && a.action_taken !== 'approve')
          );

          if (isRejected) {
            errors.push({ rowNumber, reason: 'Row rejected due to unresolved anomalies' });
            continue;
          }

          // Resolve payer
          const payerIdentifier = row.paid_by || row.payer;
          let resolvedPayer = findUserInGroup(payerIdentifier, userMap);

          if (!resolvedPayer) {
            errors.push({ rowNumber, reason: 'Could not resolve payer' });
            continue;
          }

          // Convert currency if needed
          let amountInPaise = anomalyDetector.parseAmount(row.amount);
          let amountInr = amountInPaise;
          let exchangeRate = 1;
          const currency = row.currency || 'INR';

          if (currency !== 'INR') {
            try {
              const conversion = await currencyService.convertToINR(amountInPaise, currency);
              amountInr = conversion.amountInr;
              exchangeRate = conversion.rate;
              currencyConversions.push({
                rowNumber,
                original: `${currency} ${(amountInPaise / 100).toFixed(2)}`,
                converted: `INR ${(amountInr / 100).toFixed(2)}`,
                rate: exchangeRate
              });
            } catch (convError) {
              errors.push({ rowNumber, reason: `Currency conversion failed: ${convError.message}` });
              continue;
            }
          }

          // Check for refund (negative amount)
          const isRefund = row.amount < 0 || (rowAnomalies.some(a => a.anomaly_type === 'NEGATIVE_AMOUNT'));

          // Check for settlement pattern
          const isSettlement = rowAnomalies.some(a => a.anomaly_type === 'SETTLEMENT_AS_EXPENSE');
          if (isSettlement) {
            // Skip settlement rows - they should be imported separately
            continue;
          }

          // Calculate splits
          const splitType = row.split_type || 'equal';
          const memberIds = members.map(m => m.user_id);
          let splits;

          try {
            splits = splitEngine.calculateSplits(
              amountInr,
              splitType,
              row.splits,
              memberIds
            );
          } catch (splitError) {
            errors.push({ rowNumber, reason: `Split calculation error: ${splitError.message}` });
            continue;
          }

          // Create expense
          const expense = await Expense.create({
            group_id: groupId,
            paid_by: resolvedPayer.id,
            description: row.description || 'Imported expense',
            amount: Math.abs(amountInPaise),
            currency,
            amount_inr: Math.abs(amountInr),
            exchange_rate: exchangeRate,
            split_type: splitType,
            date: row.date ? new Date(row.date) : new Date(),
            is_refund: isRefund,
            is_duplicate_flag: rowAnomalies.some(a => a.anomaly_type === 'DUPLICATE_EXACT' || a.anomaly_type === 'DUPLICATE_SIMILAR'),
            import_row_ref: `${sessionId}-${rowNumber}`
          }, { transaction });

          importedExpenses.push(expense.id);

          // Create splits
          for (const split of splits) {
            await ExpenseSplit.create({
              expense_id: expense.id,
              user_id: split.userId,
              owed_amount: split.amount,
              is_settled: false
            }, { transaction });
          }
        }

        // Update import session status
        await importSession.update({
          status: 'completed',
          report_json: {
            ...sessionData,
            importedExpenses,
            errors,
            currencyConversions,
            completedAt: new Date().toISOString()
          }
        }, { transaction });

        await transaction.commit();

        res.json({
          message: 'Import completed',
          summary: {
            totalRows: rows.length,
            importedCount: importedExpenses.length,
            errorCount: errors.length,
            conversionCount: currencyConversions.length
          },
          errors,
          currencyConversions,
          importedExpenseIds: importedExpenses
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get import session details
   * GET /api/groups/:id/import/:sessionId
   */
  getImportSession: async (req, res, next) => {
    try {
      const { id: groupId, sessionId } = req.params;
      const userId = req.userId;

      const membership = await GroupMembership.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          left_at: null
        }
      });

      if (!membership) {
        throw new ForbiddenError('Not a member of this group');
      }

      const importSession = await ImportSession.findByPk(sessionId, {
        include: [{
          model: Anomaly,
          as: 'anomalies',
          order: [['row_number', 'ASC']]
        }]
      });

      if (!importSession) {
        throw new NotFoundError('Import session');
      }

      res.json({ importSession });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get import history for group
   * GET /api/groups/:id/import-history
   */
  getImportHistory: async (req, res, next) => {
    try {
      const { id: groupId } = req.params;
      const userId = req.userId;

      const membership = await GroupMembership.findOne({
        where: {
          group_id: groupId,
          user_id: userId,
          left_at: null
        }
      });

      if (!membership) {
        throw new ForbiddenError('Not a member of this group');
      }

      const importSessions = await ImportSession.findAll({
        where: { group_id: groupId },
        include: [{
          model: User,
          as: 'importer',
          attributes: ['id', 'name', 'email']
        }],
        order: [['imported_at', 'DESC']]
      });

      res.json({
        importSessions,
        count: importSessions.length
      });
    } catch (error) {
      next(error);
    }
  }
};

/**
 * Normalize row keys to standard format
 */
function normalizeRow(row) {
  const normalized = {};
  const keyMappings = {
    'paid_by': 'paid_by',
    'payer': 'paid_by',
    'paid by': 'paid_by',
    'paidBy': 'paid_by',
    'description': 'description',
    'desc': 'description',
    'item': 'description',
    'amount': 'amount',
    'total': 'amount',
    'cost': 'amount',
    'currency': 'currency',
    'curr': 'currency',
    'date': 'date',
    'transaction_date': 'date',
    'transaction date': 'date',
    'split_type': 'split_type',
    'split type': 'split_type',
    'splitType': 'split_type',
    'splits': 'splits',
    'split': 'splits'
  };

  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.toLowerCase().trim();
    const normalizedKey = keyMappings[lowerKey] || keyMappings[key] || lowerKey;
    normalized[normalizedKey] = value;
  }

  return normalized;
}

/**
 * Find user in group by identifier
 */
function findUserInGroup(identifier, userMap) {
  if (!identifier) return null;

  // Try exact match
  let user = userMap.get(identifier?.toLowerCase()) || userMap.get(identifier?.toString());

  if (!user && typeof identifier === 'string') {
    // Try partial match on name
    for (const [key, u] of userMap) {
      if (key.includes(identifier.toLowerCase()) || identifier.toLowerCase().includes(key)) {
        user = u;
        break;
      }
    }
  }

  return user;
}

module.exports = importController;
