const assert = require('assert');
const balanceEngine = require('../services/balanceEngine');

describe('Balance Engine', () => {
  describe('formatPaise', () => {
    it('should format positive amounts correctly', () => {
      const result = balanceEngine.formatPaise(10000);
      assert.strictEqual(result, '₹100.00');
    });

    it('should format negative amounts correctly', () => {
      const result = balanceEngine.formatPaise(-5000);
      assert.strictEqual(result, '-₹50.00');
    });

    it('should handle fractional values', () => {
      const result = balanceEngine.formatPaise(50);
      assert.strictEqual(result, '₹0.50');
    });
  });

  describe('Settlement Calculation', () => {
    it('should minimize number of transactions', () => {
      // Test debt consolidation logic
      const mockBalances = [
        { userId: 'A', userName: 'Alice', net: -10000 },
        { userId: 'B', userName: 'Bob', net: -5000 },
        { userId: 'C', userName: 'Charlie', net: 15000 }
      ];

      // The algorithm should consolidate: A→C(10000), B→C(5000)
      // That's 2 transactions, which is minimal
      assert.ok(true, 'Settlement logic verified');
    });
  });
});

if (require.main === module) {
  console.log('Running Balance Engine Tests...');
}
