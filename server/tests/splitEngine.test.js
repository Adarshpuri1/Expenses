const assert = require('assert');
const splitEngine = require('../services/splitEngine');

describe('Split Engine', () => {
  describe('Equal Split', () => {
    it('should split amount equally among members', () => {
      const amount = 10000; // 100 rupees = 10000 paise
      const members = ['user1', 'user2', 'user3'];

      const result = splitEngine.calculateSplits(amount, 'equal', [], members);

      const total = result.reduce((sum, s) => sum + s.amount, 0);
      assert.strictEqual(total, amount, 'Total should equal original amount');
      assert.strictEqual(result.length, 3);
    });

    it('should distribute remainder correctly', () => {
      const amount = 10001; // 100.01 rupees
      const members = ['user1', 'user2', 'user3'];

      const result = splitEngine.calculateSplits(amount, 'equal', [], members);

      const total = result.reduce((sum, s) => sum + s.amount, 0);
      assert.strictEqual(total, amount);
      // One person should get 1 paise extra
    });

    it('should throw for zero members', () => {
      assert.throws(
        () => splitEngine.calculateSplits(10000, 'equal', [], []),
        /cannot split among zero members/i
      );
    });
  });

  describe('Exact Split', () => {
    it('should split to exact amounts specified', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', amount: 3000 },
        { userId: 'user2', amount: 4000 },
        { userId: 'user3', amount: 3000 }
      ];

      const result = splitEngine.calculateSplits(amount, 'exact', customSplits);

      assert.strictEqual(result[0].amount, 3000);
      assert.strictEqual(result[1].amount, 4000);
      assert.strictEqual(result[2].amount, 3000);
    });

    it('should throw when totals do not match', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', amount: 5000 },
        { userId: 'user2', amount: 4000 }
      ];

      assert.throws(
        () => splitEngine.calculateSplits(amount, 'exact', customSplits),
        /must equal total amount/i
      );
    });
  });

  describe('Percentage Split', () => {
    it('should split based on percentages', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', percentage: 50 },
        { userId: 'user2', percentage: 30 },
        { userId: 'user3', percentage: 20 }
      ];

      const result = splitEngine.calculateSplits(amount, 'percentage', customSplits);

      assert.strictEqual(result[0].amount, 5000);
      assert.strictEqual(result[1].amount, 3000);
      assert.strictEqual(result[2].amount, 2000);
    });

    it('should throw when percentages do not sum to 100', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', percentage: 50 },
        { userId: 'user2', percentage: 60 }
      ];

      assert.throws(
        () => splitEngine.calculateSplits(amount, 'percentage', customSplits),
        /must sum to 100/i
      );
    });

    it('should round correctly when needed', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', percentage: 33.33 },
        { userId: 'user2', percentage: 33.33 },
        { userId: 'user3', percentage: 33.34 }
      ];

      const result = splitEngine.calculateSplits(amount, 'percentage', customSplits);

      const total = result.reduce((sum, s) => sum + s.amount, 0);
      assert.strictEqual(total, amount, 'Total should equal original after rounding');
    });
  });

  describe('Shares Split', () => {
    it('should split based on share weights', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', shares: 1 },
        { userId: 'user2', shares: 2 },
        { userId: 'user3', shares: 1 }
      ];

      const result = splitEngine.calculateSplits(amount, 'shares', customSplits, ['user1', 'user2', 'user3']);

      // Total shares = 4, so user1 gets 2500, user2 gets 5000, user3 gets 2500
      assert.strictEqual(result[0].amount, 2500);
      assert.strictEqual(result[1].amount, 5000);
      assert.strictEqual(result[2].amount, 2500);
    });

    it('should throw for zero total shares', () => {
      const amount = 10000;
      const customSplits = [
        { userId: 'user1', shares: 0 },
        { userId: 'user2', shares: 0 }
      ];

      assert.throws(
        () => splitEngine.calculateSplits(amount, 'shares', customSplits, ['user1', 'user2']),
        /total shares cannot be zero/i
      );
    });
  });

  describe('Validate Split', () => {
    it('should validate a correct split', () => {
      const result = splitEngine.validateSplit(10000, 'equal', [], ['user1', 'user2']);
      assert.strictEqual(result.valid, true);
    });
  });
});

// Run tests if called directly
if (require.main === module) {
  console.log('Running Split Engine Tests...');
  const Mocha = require('mocha');
  const mocha = new Mocha();
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}
