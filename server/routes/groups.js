const express = require('express');
const router = express.Router({ mergeParams: true });
const groupController = require('../controllers/groupController');
const expenseController = require('../controllers/expenseController');
const settlementController = require('../controllers/settlementController');
const importController = require('../controllers/importController');
const { authMiddleware } = require('../middleware/auth');
const {
  validateGroupCreate,
  validateGroupUpdate,
  validateExpense,
  validateSettlement,
  validateMemberQuery
} = require('../utils/validation');

// All routes require authentication
router.use(authMiddleware);

// Group routes
router.post('/', validateGroupCreate, groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', validateGroupUpdate, groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Member routes
router.get('/:id/members', validateMemberQuery, groupController.getMembers);
router.post('/:id/members', groupController.addMember);
router.delete('/:id/members/:userId', groupController.removeMember);

// Expense routes
router.post('/:id/expenses', validateExpense, expenseController.createExpense);
router.get('/:id/expenses', expenseController.getExpenses);
router.get('/:id/expenses/:expenseId', expenseController.getExpenseById);
router.put('/:id/expenses/:expenseId', expenseController.updateExpense);
router.delete('/:id/expenses/:expenseId', expenseController.deleteExpense);

// Balance routes
router.get('/:id/balances', expenseController.getBalances);
router.get('/:id/settlement-suggestions', expenseController.getSettlementSuggestions);

// Settlement routes
router.post('/:id/settlements', validateSettlement, settlementController.createSettlement);
router.get('/:id/settlements', settlementController.getSettlements);
router.get('/:id/settlements/:settlementId', settlementController.getSettlementById);
router.delete('/:id/settlements/:settlementId', settlementController.deleteSettlement);

// Import routes
router.post('/:id/import', importController.uploadCsv);
router.post('/:id/import/:sessionId/confirm', importController.confirmImport);
router.get('/:id/import/:sessionId', importController.getImportSession);
router.get('/:id/import-history', importController.getImportHistory);
router.post('/:id/import/:sessionId/anomalies/:anomalyId', importController.resolveAnomaly);

// Stats
router.get('/:id/stats', groupController.getGroupStats);

module.exports = router;
