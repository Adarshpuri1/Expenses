const { Settlement, Group, GroupMembership, User, Expense, ExpenseSplit } = require('../models');
const { sequelize } = require('../models');
const { ApiError, NotFoundError, ForbiddenError } = require('../utils/errors');
const balanceEngine = require('../services/balanceEngine');

const createSettlement = async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { paid_to, amount, date, expense_refs, notes } = req.body;
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

    // Verify payee is also a member
    const payeeMembership = await GroupMembership.findOne({
      where: {
        group_id: groupId,
        user_id: paid_to,
        left_at: null
      }
    });

    if (!payeeMembership) {
      throw new ApiError('INVALID_PAYEE', 'Payee is not an active member');
    }

    const transaction = await sequelize.transaction();

    try {
      const settlement = await Settlement.create({
        group_id: groupId,
        paid_by: userId,
        paid_to,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        expense_refs: expense_refs || null,
        notes: notes || null
      }, { transaction });

      // Mark related splits as settled if expense_refs provided
      if (expense_refs && expense_refs.length > 0) {
        for (const expenseId of expense_refs) {
          await ExpenseSplit.update(
            {
              is_settled: true,
              settled_at: new Date()
            },
            {
              where: {
                expense_id: expenseId,
                user_id: userId
              },
              transaction
            }
          );
        }
      }

      await transaction.commit();

      const createdSettlement = await Settlement.findByPk(settlement.id, {
        include: [
          {
            model: User,
            as: 'payer',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'payee',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json({
        message: 'Settlement recorded successfully',
        settlement: createdSettlement
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const getSettlements = async (req, res, next) => {
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
      whereClause.date = { ...whereClause.date, [require('sequelize').Op.gte]: new Date(from) };
    }
    if (to) {
      whereClause.date = { ...whereClause.date, [require('sequelize').Op.lte]: new Date(to) };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: settlements } = await Settlement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'payee',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['date', 'DESC']],
      limit: limitNum,
      offset
    });

    res.json({
      settlements,
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

const getSettlementById = async (req, res, next) => {
  try {
    const { id: groupId, settlementId } = req.params;
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

    const settlement = await Settlement.findOne({
      where: {
        id: settlementId,
        group_id: groupId
      },
      include: [
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'payee',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!settlement) {
      throw new NotFoundError('Settlement');
    }

    res.json({ settlement });
  } catch (error) {
    next(error);
  }
};

const deleteSettlement = async (req, res, next) => {
  try {
    const { id: groupId, settlementId } = req.params;
    const userId = req.userId;

    const settlement = await Settlement.findOne({
      where: { id: settlementId, group_id: groupId }
    });

    if (!settlement) {
      throw new NotFoundError('Settlement');
    }

    if (settlement.paid_by !== userId) {
      throw new ForbiddenError('Only the payer can delete this settlement');
    }

    await settlement.destroy();

    res.json({ message: 'Settlement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSettlement,
  getSettlements,
  getSettlementById,
  deleteSettlement
};
