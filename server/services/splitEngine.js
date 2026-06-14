const splitEngine = {
  /**
   * Calculate splits based on split type
   * @param {number} totalAmount - Total amount in paise
   * @param {string} splitType - 'equal', 'exact', 'percentage', 'shares'
   * @param {Array} customSplits - Custom split configuration
   * @param {Array} memberIds - Array of user IDs to split among
   * @returns {Array} Array of { userId, amount } objects
   */
  calculateSplits(totalAmount, splitType = 'equal', customSplits = [], memberIds = []) {
    totalAmount = Math.round(totalAmount);
    const splits = [];

    switch (splitType) {
      case 'equal':
        return this.calculateEqualSplit(totalAmount, memberIds);

      case 'exact':
        return this.calculateExactSplit(totalAmount, customSplits);

      case 'percentage':
        return this.calculatePercentageSplit(totalAmount, customSplits, memberIds);

      case 'shares':
        return this.calculateSharesSplit(totalAmount, customSplits, memberIds);

      default:
        return this.calculateEqualSplit(totalAmount, memberIds);
    }
  },

  /**
   * Equal split among all members
   */
  calculateEqualSplit(totalAmount, memberIds) {
    if (!memberIds || memberIds.length === 0) {
      throw new Error('Cannot split among zero members');
    }

    totalAmount = Math.round(totalAmount);
    const baseAmount = Math.floor(totalAmount / memberIds.length);
    const remainder = totalAmount - (baseAmount * memberIds.length);

    return memberIds.map((userId, index) => ({
      userId,
      amount: baseAmount + (index < remainder ? 1 : 0)
    }));
  },

  /**
   * Exact split - user specifies exact amounts
   */
  calculateExactSplit(totalAmount, customSplits) {
    if (!customSplits || customSplits.length === 0) {
      throw new Error('Exact split requires custom split data');
    }

    const sum = customSplits.reduce((acc, s) => acc + s.amount, 0);

    if (sum !== totalAmount) {
      throw new Error(`Exact split totals (${sum}) must equal total amount (${totalAmount})`);
    }

    return customSplits.map(s => ({
      userId: s.userId,
      amount: Math.round(s.amount)
    }));
  },

  /**
   * Percentage split - user specifies percentages for each member
   */
  calculatePercentageSplit(totalAmount, customSplits, memberIds) {
    if (!customSplits || customSplits.length === 0) {
      throw new Error('Percentage split requires custom split data');
    }

    // Validate percentages sum to 100
    const sum = customSplits.reduce((acc, s) => acc + s.percentage, 0);

    if (Math.abs(sum - 100) > 0.01) {
      throw new Error(`Percentages must sum to 100, got ${sum}`);
    }

    const splits = [];
    let distributed = 0;

    customSplits.forEach((split, index) => {
      if (index === customSplits.length - 1) {
        // Last person gets remainder to avoid rounding issues
        splits.push({
          userId: split.userId,
          amount: totalAmount - distributed
        });
      } else {
        const amount = Math.round(totalAmount * split.percentage / 100);
        distributed += amount;
        splits.push({
          userId: split.userId,
          amount
        });
      }
    });

    return splits;
  },

  /**
   * Shares split - weighted allocation based on shares
   */
  calculateSharesSplit(totalAmount, customSplits, memberIds) {
    if (!customSplits || customSplits.length === 0) {
      throw new Error('Shares split requires custom split data');
    }

    const totalShares = customSplits.reduce((acc, s) => acc + s.shares, 0);

    if (totalShares === 0) {
      throw new Error('Total shares cannot be zero');
    }

    const splits = [];
    let distributed = 0;

    customSplits.forEach((split, index) => {
      if (index === customSplits.length - 1) {
        // Last person gets remainder
        splits.push({
          userId: split.userId,
          amount: totalAmount - distributed
        });
      } else {
        const amount = Math.round(totalAmount * split.shares / totalShares);
        distributed += amount;
        splits.push({
          userId: split.userId,
          amount
        });
      }
    });

    return splits;
  },

  /**
   * Validate split configuration
   */
  validateSplit(totalAmount, splitType, customSplits, memberIds) {
    try {
      const splits = this.calculateSplits(totalAmount, splitType, customSplits, memberIds);

      // Verify totals match
      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      if (sum !== totalAmount) {
        return {
          valid: false,
          error: `Split totals (${sum}) do not match amount (${totalAmount})`
        };
      }

      return { valid: true, splits };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
};

module.exports = splitEngine;
