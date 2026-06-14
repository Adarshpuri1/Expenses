const assert = require('assert');
const anomalyDetector = require('../services/anomalyDetector');

describe('Anomaly Detector', () => {
  describe('Duplicate Detection', () => {
    it('should detect exact duplicates', () => {
      const row = {
        description: 'Coffee at Starbucks',
        amount: 5000,
        date: '2024-01-15'
      };

      const existingExpenses = [{
        description: 'Coffee at Starbucks',
        amount: 5000,
        amount_inr: 5000,
        date: new Date('2024-01-15')
      }];

      const result = anomalyDetector.detectExactDuplicate(row, existingExpenses);
      assert.ok(result, 'Should detect exact duplicate');
    });

    it('should not detect non-duplicates', () => {
      const row = {
        description: 'Coffee at Starbucks',
        amount: 5000,
        date: '2024-01-15'
      };

      const existingExpenses = [{
        description: 'Coffee at Cafe',
        amount: 4000,
        amount_inr: 4000,
        date: new Date('2024-01-10')
      }];

      const result = anomalyDetector.detectExactDuplicate(row, existingExpenses);
      assert.strictEqual(result, undefined);
    });
  });

  describe('Similar Duplicate Detection', () => {
    it('should detect similar descriptions with same amount', () => {
      const row = {
        description: 'Coffee Starbucks',
        amount: 5000
      };

      const existingExpenses = [{
        description: 'Coffee at Starbucks',
        amount_inr: 5000
      }];

      const result = anomalyDetector.detectSimilarDuplicate(row, existingExpenses);
      assert.ok(result);
    });
  });

  describe('Settlement Pattern Detection', () => {
    it('should detect payment patterns', () => {
      const row1 = { description: 'Paid John back' };
      const row2 = { description: 'Settlement for dinner' };
      const row3 = { description: 'Reimburse John' };
      const row4 = { description: 'Transfer to Sarah' };

      assert.ok(anomalyDetector.detectSettlementPattern(row1));
      assert.ok(anomalyDetector.detectSettlementPattern(row2));
      assert.ok(anomalyDetector.detectSettlementPattern(row3));
      assert.ok(anomalyDetector.detectSettlementPattern(row4));
    });

    it('should not flag normal expenses', () => {
      const row = { description: 'Groceries from Walmart' };
      const result = anomalyDetector.detectSettlementPattern(row);
      assert.strictEqual(result, false);
    });
  });

  describe('Amount Parsing', () => {
    it('should parse numeric amounts', () => {
      assert.strictEqual(anomalyDetector.parseAmount(100), 10000); // assumes rupees
      assert.strictEqual(anomalyDetector.parseAmount(100.50), 10050);
    });

    it('should parse string amounts', () => {
      assert.strictEqual(anomalyDetector.parseAmount('100'), 10000);
      assert.strictEqual(anomalyDetector.parseAmount('$100.50'), 10050);
      assert.strictEqual(anomalyDetector.parseAmount('₹100'), 10000);
    });
  });

  describe('Similarity Calculation', () => {
    it('should calculate similarity between strings', () => {
      const sim1 = anomalyDetector.calculateSimilarity('coffee at starbucks', 'coffee starbucks');
      assert.ok(sim1 > 0.5, 'Similar strings should have high similarity');

      const sim2 = anomalyDetector.calculateSimilarity('coffee shop', 'grocery store');
      assert.ok(sim2 < 0.5, 'Different strings should have low similarity');
    });
  });
});

if (require.main === module) {
  console.log('Running Anomaly Detector Tests...');
}
