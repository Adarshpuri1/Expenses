const { Group, GroupMembership, User, Expense, ExpenseSplit } = require('../models');
const { sequelize } = require('../models');
const { ApiError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { Op } = require('sequelize');

const createGroup = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    const group = await Group.create({
      name,
      created_by: userId
    });

    // Add creator as member
    await GroupMembership.create({
      group_id: group.id,
      user_id: userId,
      joined_at: new Date()
    });

    // Add additional members if provided
    if (members && members.length > 0) {
      const validMembers = members.filter(id => id !== userId);
      for (const memberId of validMembers) {
        const member = await User.findByPk(memberId);
        if (member) {
          await GroupMembership.create({
            group_id: group.id,
            user_id: memberId,
            joined_at: new Date()
          });
        }
      }
    }

    const createdGroup = await Group.findByPk(group.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Group created successfully',
      group: createdGroup
    });
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, res, next) => {
  try {
    const userId = req.userId;

    const memberships = await GroupMembership.findAll({
      where: {
        user_id: userId,
        left_at: null
      },
      include: [
        {
          model: Group,
          as: 'group',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email']
            },
            {
              model: GroupMembership,
              as: 'memberships',
              where: { left_at: null },
              required: false,
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email']
                }
              ]
            }
          ]
        }
      ],
      order: [['joined_at', 'DESC']]
    });

    const groups = memberships.map(m => m.group);

    res.json({
      groups,
      count: groups.length
    });
  } catch (error) {
    next(error);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const membership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      throw new NotFoundError('Group');
    }

    const group = await Group.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: GroupMembership,
          as: 'memberships',
          where: { left_at: null },
          required: false,
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

    if (!group) {
      throw new NotFoundError('Group');
    }

    res.json({ group });
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.userId;

    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group');
    }

    const membership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      throw new ForbiddenError('Not a member of this group');
    }

    await group.update({ name });

    res.json({
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group');
    }

    if (group.created_by !== userId) {
      throw new ForbiddenError('Only the group creator can delete the group');
    }

    await group.destroy();

    res.json({
      message: 'Group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId: newMemberId } = req.body;
    const userId = req.userId;

    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group');
    }

    const membership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      throw new ForbiddenError('Not a member of this group');
    }

    const existingMembership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: newMemberId
      }
    });

    if (existingMembership && !existingMembership.left_at) {
      throw new ApiError('ALREADY_MEMBER', 'User is already a member of this group', 409);
    }

    // Reactivate or create membership
    if (existingMembership) {
      await existingMembership.update({ left_at: null, joined_at: new Date() });
    } else {
      const newMember = await User.findByPk(newMemberId);
      if (!newMember) {
        throw new NotFoundError('User');
      }
      await GroupMembership.create({
        group_id: id,
        user_id: newMemberId,
        joined_at: new Date()
      });
    }

    res.json({
      message: 'Member added successfully'
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { id, userId: memberId } = req.params;
    const userId = req.userId;

    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group');
    }

    const adminMembership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: userId,
        left_at: null
      }
    });

    if (!adminMembership) {
      throw new ForbiddenError('Not a member of this group');
    }

    const membership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: memberId,
        left_at: null
      }
    });

    if (!membership) {
      throw new NotFoundError('Member');
    }

    // Set left_at to mark as inactive
    await membership.update({ left_at: new Date() });

    res.json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { at } = req.query;
    const userId = req.userId;

    const membership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      throw new ForbiddenError('Not a member of this group');
    }

    const whereClause = {
      group_id: id
    };

    if (at) {
      const atDate = new Date(at);
      whereClause.joined_at = { [Op.lte]: atDate };
    }

    const memberships = await GroupMembership.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['joined_at', 'ASC']]
    });

    const filteredMemberships = at
      ? memberships.filter(m => !m.left_at || m.left_at > new Date(at))
      : memberships.filter(m => !m.left_at);

    const members = filteredMemberships.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      joined_at: m.joined_at,
      left_at: m.left_at,
      is_active: !m.left_at
    }));

    res.json({
      members,
      count: members.length,
      as_of: at || new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

const getGroupStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const membership = await GroupMembership.findOne({
      where: {
        group_id: id,
        user_id: userId,
        left_at: null
      }
    });

    if (!membership) {
      throw new ForbiddenError('Not a member of this group');
    }

    const expenseCount = await Expense.count({
      where: { group_id: id }
    });

    const totalAmount = await Expense.sum('amount_inr', {
      where: { group_id: id }
    }) || 0;

    const memberCount = await GroupMembership.count({
      where: {
        group_id: id,
        left_at: null
      }
    });

    res.json({
      stats: {
        expense_count: expenseCount,
        total_amount: totalAmount,
        total_amount_formatted: `₹${(totalAmount / 100).toFixed(2)}`,
        member_count: memberCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getMembers,
  getGroupStats
};
