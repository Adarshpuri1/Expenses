const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const { Group, GroupMembership, User } = require('../models');
const { sequelize } = require('../models');
const { ApiError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { Op } = require('sequelize');
const splitEngine = require('../services/splitEngine');
const balanceEngine = require('../services/balanceEngine');
const currencyService = require('../services/currencyService');

const createExpense = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { paid_by, description, amount, currency, split_type, date, splits, is_refund } = req.body;
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

    // Verify payer is a member
    const payerIsMember = await GroupMembership.findOne({
      where: {
        group_id: groupId,
        user_id: paid_by,
        left_at: null
      }
    });

    if (!payerIsMember) {
      throw new ApiError('INVALID_PAYER', 'Paid by user is not an active member');
    }

    // Get active members at expense date for splitting
    const expenseDate = date ? new Date(date) : new Date();
    const activeMembers = await GroupMembership.getActiveMembersAt(groupId, expenseDate);

    // Convert amount to INR if needed
    let amountInr = amount;
    let exchangeRate = 1;

    if (currency && currency !== 'INR') {
      const conversion = await currencyService.convertToINR(amount, currency);
      amountInr = conversion.amountInr;
      exchangeRate = conversion.rate;
    }

    // Calculate splits
    const memberIds = activeMembers.map(m => m.user_id);
    const calculatedSplits = splitEngine.calculateSplits(
      amountInr,
      split_type || 'equal',
      splits,
      memberIds
    );

    const transaction = await sequelize.transaction();

    try {
      const expense = await Expense.create({
        group_id: groupId,
        paid_by,
        description,
        amount,
        currency: currency || 'INR',
        amount_inr: amountInr,
        exchange_rate: exchangeRate,
        split_type: split_type || 'equal',
        date: expenseDate,
        is_refund: is_refund || false
      }, { transaction });

      // Create expense splits
      const expenseSplits = [];
      for (const split of calculatedSplits) {
        expenseSplits.push({
          expense_id: expense.id,
          user_id: split.userId,
          owed_amount: split.amount
        });
      }

      await ExpenseSplit.bulkCreate(expenseSplits, { transaction });

      await transaction.commit();

      const createdExpense = await Expense.findByPk(expense.id, {
        include: [
          {
            model: User,
            as: 'payer',
            attributes: ['id', 'name', 'email']
          },
          {
            model: ExpenseSplit,
            as: 'splits',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        message: 'Expense created successfully',
        expense: createdExpense
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { page, limit, from, to } = req.query;
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

    const whereClause = { group_id: groupId };

    if (from) {
      whereClause.date = { ...whereClause.date, [Op.gte]: new Date(from) };
    }
    if (to) {
      whereClause.date = { ...whereClause.date, [Op.lte]: new Date(to) };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExpenseSplit,
          as: 'splits',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit: limitNum,
      offset
    });

    res.json({
      expenses,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const { id: groupId, expenseId } = req.params;
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

    const expense = await Expense.findOne({
      where: {
        id: expenseId,
        group_id: groupId
      },
      include: [
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ExpenseSplit,
          as: 'splits',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!expense) {
      throw new NotFoundError('Expense');
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id: groupId, expenseId } = req.params;
    const userId = req.userId;

    const expense = await Expense.findOne({
      where: { id: expenseId, group_id: groupId }
    });

    if (!expense) {
      throw new NotFoundError('Expense');
    }

    if (expense.paid_by !== userId) {
      throw new ForbiddenError('Only the payer can edit this expense');
    }

    const { description, amount, split_type, date } = req.body;

    await expense.update({
      description: description || expense.description,
      amount: amount || expense.amount,
      split_type: split_type || expense.split_type,
      date: date || expense.date
    });

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id: groupId, expenseId } = req.params;
    const userId = req.userId;

    const expense = await Expense.findOne({
      where: { id: expenseId, group_id: groupId }
    });

    if (!expense) {
      throw new NotFoundError('Expense');
    }

    if (expense.paid_by !== userId) {
      throw new ForbiddenError('Only the payer can delete this expense');
    }

    await ExpenseSplit.destroy({ where: { expense_id: expenseId } });
    await expense.destroy();

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getBalances = async (req, res, next) => {
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

    const balances = await balanceEngine.calculateGroupBalances(groupId);

    res.json({ balances });
  } catch (error) {
    next(error);
  }
};

const getSettlementSuggestions = async (req, res, next) => {
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

    const settlements = await balanceEngine.calculateSettlements(groupId);

    res.json({ settlements });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getBalances,
  getSettlementSuggestions
};
