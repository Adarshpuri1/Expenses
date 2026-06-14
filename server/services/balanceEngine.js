const { Expense, ExpenseSplit, User, Settlement, GroupMembership } = require('../models');
const { Op } = require('sequelize');

const balanceEngine = {
  /**
   * Calculate balances for all members in a group
   * Returns paid, owed, and net for each member
   */
  async calculateGroupBalances(groupId) {
    // Get all active and past members who have transactions
    const expenses = await Expense.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: ExpenseSplit,
          as: 'splits'
        }
      ]
    });

    // Get all settlements
    const settlements = await Settlement.findAll({
      where: { group_id: groupId }
    });

    // Get all members
    const memberships = await GroupMembership.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Initialize balances for all members
    const balances = {};

    memberships.forEach(m => {
      balances[m.user_id] = {
        userId: m.user_id,
        userName: m.user.name,
        userEmail: m.user.email,
        paid: 0,
        owed: 0,
        net: 0,
        expenses_paid: [],
        expenses_owed: []
      };
    });

    // Process expenses
    expenses.forEach(expense => {
      const amountInr = expense.amount_inr || expense.amount;

      // Track what the payer paid
      if (!balances[expense.paid_by]) {
        balances[expense.paid_by] = {
          userId: expense.paid_by,
          paid: 0,
          owed: 0,
          net: 0,
          expenses_paid: [],
          expenses_owed: []
        };
      }

      balances[expense.paid_by].paid += amountInr;
      balances[expense.paid_by].net += amountInr;
      balances[expense.paid_by].expenses_paid.push({
        expenseId: expense.id,
        description: expense.description,
        amount: amountInr
      });

      // Process splits (what each person owes)
      expense.splits.forEach(split => {
        if (!balances[split.user_id]) {
          balances[split.user_id] = {
            userId: split.user_id,
            paid: 0,
            owed: 0,
            net: 0,
            expenses_paid: [],
            expenses_owed: []
          };
        }

        balances[split.user_id].owed += split.owed_amount;
        balances[split.user_id].net -= split.owed_amount;
        balances[split.user_id].expenses_owed.push({
          expenseId: expense.id,
          description: expense.description,
          amount: split.owed_amount
        });
      });
    });

    // Process settlements
    settlements.forEach(settlement => {
      const amount = settlement.amount;

      if (balances[settlement.paid_by]) {
        balances[settlement.paid_by].net += amount;
      }
      if (balances[settlement.paid_to]) {
        balances[settlement.paid_to].net -= amount;
      }
    });

    // Convert to array and calculate formatted amounts
    return Object.values(balances).map(b => ({
      ...b,
      paid_formatted: this.formatPaise(b.paid),
      owed_formatted: this.formatPaise(b.owed),
      net_formatted: this.formatPaise(b.net)
    }));
  },

  /**
   * Calculate simplified settlements using debt minimization algorithm
   */
  async calculateSettlements(groupId) {
    const balances = await this.calculateGroupBalances(groupId);

    // Separate debtors and creditors
    const debtors = [];
    const creditors = [];

    balances.forEach(b => {
      if (b.net < 0) {
        debtors.push({ ...b, debt: Math.abs(b.net) });
      } else if (b.net > 0) {
        creditors.push({ ...b, credit: b.net });
      }
    });

    // Sort by amount (descending) for greedy matching
    debtors.sort((a, b) => b.debt - a.debt);
    creditors.sort((a, b) => b.credit - a.credit);

    const simplified = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(debtor.debt, creditor.credit);

      if (amount > 0) {
        // Find expense IDs that contributed to this relationship
        const expenseRefs = this.findExpenseRefs(debtor, creditor);

        simplified.push({
          from_user_id: debtor.userId,
          from_user_name: debtor.userName,
          to_user_id: creditor.userId,
          to_user_name: creditor.userName,
          amount: amount,
          amount_formatted: this.formatPaise(amount),
          expense_refs: expenseRefs,
          explanation: this.generateExplanation(debtor, creditor, amount)
        });
      }

      debtor.debt -= amount;
      creditor.credit -= amount;

      if (debtor.debt === 0) i++;
      if (creditor.credit === 0) j++;
    }

    return simplified;
  },

  /**
   * Find expense IDs that created the debt between two users
   */
  findExpenseRefs(debtor, creditor) {
    const refs = [];

    // Find expenses where creditor paid and debtor owes
    if (debtor.expenses_owed && creditor.expenses_paid) {
      const paidIds = new Set(creditor.expenses_paid.map(e => e.expenseId));
      debtor.expenses_owed.forEach(e => {
        if (paidIds.has(e.expenseId)) {
          refs.push(e.expenseId);
        }
      });
    }

    return refs;
  },

  /**
   * Generate human-readable explanation for settlement
   */
  generateExplanation(debtor, creditor, amount) {
    return `${debtor.userName} owes ${creditor.userName} ₹${(amount / 100).toFixed(2)}`;
  },

  /**
   * Format paise as rupees string
   */
  formatPaise(paise) {
    const rupees = paise / 100;
    const prefix = rupees >= 0 ? '₹' : '-₹';
    return `${prefix}${Math.abs(rupees).toFixed(2)}`;
  },

  /**
   * Get balance summary for current user in a group
   */
  async getUserBalanceSummary(groupId, userId) {
    const balances = await this.calculateGroupBalances(groupId);
    return balances.find(b => b.userId === userId) || null;
  },

  /**
   * Calculate what a specific user owes to others
   */
  async getUserDebts(groupId, userId) {
    const settlements = await this.calculateSettlements(groupId);
    return settlements.filter(s => s.from_user_id === userId);
  },

  /**
   * Calculate what others owe to a specific user
   */
  async getUserCredits(groupId, userId) {
    const settlements = await this.calculateSettlements(groupId);
    return settlements.filter(s => s.to_user_id === userId);
  }
};

module.exports = balanceEngine;
