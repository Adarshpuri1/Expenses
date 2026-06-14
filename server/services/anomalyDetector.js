const { Expense, GroupMembership, User } = require('../models');
const { Op } = require('sequelize');

const anomalyDetector = {
  /**
   * Detect all anomalies in a dataset
   */
  async detectAnomalies(rows, groupId, users) {
    const anomalies = [];
    const userMap = this.createUserMap(users);
    const existingExpenses = await this.getExistingExpenses(groupId);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Run all detection checks
      const rowAnomalies = await this.detectRowAnomalies(
        row,
        rowNumber,
        groupId,
        userMap,
        existingExpenses
      );

      anomalies.push(...rowAnomalies);
    }

    return anomalies;
  },

  /**
   * Create a map of user email/name to user object
   */
  createUserMap(users) {
    const map = new Map();
    users.forEach(user => {
      map.set(user.email?.toLowerCase(), user);
      map.set(user.name?.toLowerCase(), user);
      map.set(user.id?.toString(), user);
    });
    return map;
  },

  /**
   * Get existing expenses for duplicate detection
   */
  async getExistingExpenses(groupId) {
    return await Expense.findAll({
      where: { group_id: groupId },
      order: [['date', 'DESC']]
    });
  },

  /**
   * Detect anomalies for a single row
   */
  async detectRowAnomalies(row, rowNumber, groupId, userMap, existingExpenses) {
    const anomalies = [];

    // 1. DUPLICATE_EXACT
    const exactDuplicate = this.detectExactDuplicate(row, existingExpenses);
    if (exactDuplicate) {
      anomalies.push({
        rowNumber,
        anomalyType: 'DUPLICATE_EXACT',
        severity: 'error',
        description: `Exact duplicate of existing expense: ${exactDuplicate.description}`,
        rawData: row,
        suggestedAction: 'Flag for approval or skip import',
        requiresApproval: true
      });
    }

    // 2. DUPLICATE_SIMILAR
    const similarDuplicate = this.detectSimilarDuplicate(row, existingExpenses);
    if (similarDuplicate) {
      anomalies.push({
        rowNumber,
        anomalyType: 'DUPLICATE_SIMILAR',
        severity: 'warning',
        description: `Similar to existing expense: ${similarDuplicate.description} (${similarDuplicate.date})`,
        rawData: row,
        suggestedAction: 'Review and decide: import as new, update existing, or skip',
        requiresApproval: true
      });
    }

    // 3. CURRENCY_MISMATCH
    if (row.currency && row.currency !== 'INR') {
      anomalies.push({
        rowNumber,
        anomalyType: 'CURRENCY_MISMATCH',
        severity: 'info',
        description: `Non-INR currency: ${row.currency}. Will be auto-converted.`,
        rawData: row,
        suggestedAction: 'Auto-convert and log the exchange rate',
        requiresApproval: false
      });
    }

    // 4. SETTLEMENT_AS_EXPENSE
    const isSettlement = this.detectSettlementPattern(row);
    if (isSettlement) {
      anomalies.push({
        rowNumber,
        anomalyType: 'SETTLEMENT_AS_EXPENSE',
        severity: 'warning',
        description: 'This appears to be a settlement (payment to person), not an expense.',
        rawData: row,
        suggestedAction: 'Move to settlements table instead of expenses',
        requiresApproval: true
      });
    }

    // 5. NEGATIVE_AMOUNT
    if (row.amount !== undefined && row.amount < 0) {
      anomalies.push({
        rowNumber,
        anomalyType: 'NEGATIVE_AMOUNT',
        severity: 'warning',
        description: `Negative amount: ${row.amount}. Marking as refund.`,
        rawData: row,
        suggestedAction: 'Mark this as a refund transaction',
        requiresApproval: false
      });
    }

    // 6. FUTURE_DATE
    const rowDate = row.date ? new Date(row.date) : new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (rowDate > today) {
      anomalies.push({
        rowNumber,
        anomalyType: 'FUTURE_DATE',
        severity: 'warning',
        description: `Future date: ${row.date}. Expense dated in the future.`,
        rawData: row,
        suggestedAction: 'Verify the date is correct before importing',
        requiresApproval: false
      });
    }

    // 7. INACTIVE_MEMBER
    const payer = row.paid_by || row.payer;
    if (payer && userMap) {
      const payerUser = this.findUser(payer, userMap);
      if (payerUser) {
        const isActive = await this.checkActiveMembership(groupId, payerUser.id, rowDate);
        if (!isActive) {
          anomalies.push({
            rowNumber,
            anomalyType: 'INACTIVE_MEMBER',
            severity: 'error',
            description: `Payer ${payer} was not an active member on ${row.date}`,
            rawData: row,
            suggestedAction: 'Exclude this member or verify membership dates',
            requiresApproval: true
          });
        }
      }
    }

    // 8. MISSING_PAYER
    if (!row.paid_by && !row.payer) {
      anomalies.push({
        rowNumber,
        anomalyType: 'MISSING_PAYER',
        severity: 'critical',
        description: 'No payer specified for this expense.',
        rawData: row,
        suggestedAction: 'Reject row - cannot import without payer',
        requiresApproval: true
      });
    }

    // 9. INVALID_SPLIT
    const splitError = this.validateSplit(row);
    if (splitError) {
      anomalies.push({
        rowNumber,
        anomalyType: 'INVALID_SPLIT',
        severity: 'critical',
        description: `Invalid split: ${splitError}`,
        rawData: row,
        suggestedAction: 'Reject row - fix split configuration',
        requiresApproval: true
      });
    }

    // 10. MISSING_CURRENCY
    if (!row.currency) {
      anomalies.push({
        rowNumber,
        anomalyType: 'MISSING_CURRENCY',
        severity: 'warning',
        description: 'No currency specified. Defaulting to INR.',
        rawData: row,
        suggestedAction: 'Default to INR and warn user',
        requiresApproval: false
      });
    }

    // 11. FORMAT_INCONSISTENCY
    const dateFormatError = this.validateDateFormat(row.date);
    if (row.date && dateFormatError) {
      anomalies.push({
        rowNumber,
        anomalyType: 'FORMAT_INCONSISTENCY',
        severity: 'info',
        description: `Date format normalized: ${dateFormatError.original} → ${dateFormatError.normalized}`,
        rawData: row,
        suggestedAction: 'Auto-normalize date format',
        requiresApproval: false
      });
    }

    // 12. SPLIT_MEMBER_MISMATCH
    if (row.splits && userMap) {
      const splitMemberError = this.validateSplitMembers(row.splits, groupId, userMap);
      if (splitMemberError) {
        anomalies.push({
          rowNumber,
          anomalyType: 'SPLIT_MEMBER_MISMATCH',
          severity: 'critical',
          description: splitMemberError,
          rawData: row,
          suggestedAction: 'Reject row - specified members not found',
          requiresApproval: true
        });
      }
    }

    return anomalies;
  },

  /**
   * Detect exact duplicates
   */
  detectExactDuplicate(row, existingExpenses) {
    const rowAmount = this.parseAmount(row.amount);
    const rowDate = row.date ? new Date(row.date) : null;

    return existingExpenses.find(expense => {
      const amountMatch = expense.amount_inr === rowAmount || expense.amount === rowAmount;
      const dateMatch = rowDate && new Date(expense.date).getTime() === rowDate.getTime();
      const descMatch = expense.description.toLowerCase() === (row.description || '').toLowerCase();

      return amountMatch && dateMatch && descMatch;
    });
  },

  /**
   * Detect similar duplicates (amount and description similar)
   */
  detectSimilarDuplicate(row, existingExpenses) {
    const rowAmount = this.parseAmount(row.amount);
    const rowDesc = (row.description || '').toLowerCase();

    if (rowDesc.length < 5) return null;

    return existingExpenses.find(expense => {
      const amountMatch = Math.abs((expense.amount_inr || expense.amount) - rowAmount) < 100;
      const expenseDesc = expense.description.toLowerCase();
      const descSimilar = this.calculateSimilarity(rowDesc, expenseDesc) > 0.7;

      return amountMatch && descSimilar;
    });
  },

  /**
   * Calculate string similarity (Jaccard similarity)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  },

  /**
   * Detect settlement pattern (payment to person's name)
   */
  detectSettlementPattern(row) {
    const desc = (row.description || '').toLowerCase();
    const settlementPatterns = [
      /paid\s+\w+\s+(back|settle)/,
      /settlement/,
      /paid\s+to\s+\w+/,
      /settled\s+with/,
      /transfer\s+to\s+\w+/,
      /reimburse/
    ];

    return settlementPatterns.some(p => p.test(desc));
  },

  /**
   * Check if user was active member on a specific date
   */
  async checkActiveMembership(groupId, userId, date) {
    const membership = await GroupMembership.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        joined_at: { [Op.lte]: date }
      }
    });

    if (!membership) return false;
    if (!membership.left_at) return true;
    return membership.left_at > date;
  },

  /**
   * Validate split configuration
   */
  validateSplit(row) {
    if (!row.split_type && !row.splits) return null;

    if (row.split_type === 'percentage' && row.splits) {
      const total = row.splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
      if (Math.abs(total - 100) > 1) {
        return `Percentages sum to ${total}%, must equal 100%`;
      }
    }

    if (row.split_type === 'exact' && row.splits) {
      const splitTotal = row.splits.reduce((sum, s) => sum + this.parseAmount(s.amount), 0);
      const rowAmount = this.parseAmount(row.amount);
      if (splitTotal !== rowAmount) {
        return `Split total (${splitTotal}) doesn't match amount (${rowAmount})`;
      }
    }

    return null;
  },

  /**
   * Validate split members exist in group
   */
  validateSplitMembers(splits, groupId, userMap) {
    for (const split of splits) {
      const user = this.findUser(split.userId || split.user || split.member, userMap);
      if (!user) {
        return `Split member not found: ${split.userId || split.user || split.member}`;
      }
    }
    return null;
  },

  /**
   * Validate date format
   */
  validateDateFormat(dateStr) {
    if (!dateStr) return null;

    const original = dateStr;
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      return { original, normalized: 'Invalid date' };
    }

    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ];

    const normalized = date.toISOString().split('T')[0];
    if (dateStr !== normalized) {
      return { original, normalized };
    }

    return null;
  },

  /**
   * Parse amount to paise (integer)
   */
  parseAmount(amount) {
    if (typeof amount === 'number') {
      // Assume in rupees if decimal, in paise if integer and large
      if (amount < 10000 && Number.isInteger(amount)) {
        // Likely rupees, convert to paise
        return Math.round(amount * 100);
      }
      return Math.round(amount);
    }
    if (typeof amount === 'string') {
      const cleaned = amount.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return Math.round(num * 100);
    }
    return 0;
  },

  /**
   * Find user by ID, email, or name
   */
  findUser(identifier, userMap) {
    if (!identifier) return null;
    return userMap.get(identifier?.toLowerCase()) || userMap.get(identifier?.toString());
  },

  /**
   * Classify row severity summary
   */
  classifyRows(anomalies, totalRows) {
    const cleanRows = totalRows - new Set(anomalies.map(a => a.rowNumber)).size;
    const criticalCount = anomalies.filter(a => a.severity === 'critical' || a.severity === 'error').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;
    const infoCount = anomalies.filter(a => a.severity === 'info').length;

    return {
      cleanRows,
      cleanPercentage: Math.round((cleanRows / totalRows) * 100),
      criticalCount,
      warningCount,
      infoCount,
      totalAnomalies: anomalies.length
    };
  }
};

module.exports = anomalyDetector;
