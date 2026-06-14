const ExchangeRate = require('../models/ExchangeRate');
const config = require('../config');
const { sequelize } = require('../models');

const currencyService = {
  /**
   * Fetch exchange rate from external API
   */
  async fetchRateFromAPI(fromCurrency, toCurrency) {
    try {
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      const baseUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest';

      const response = await fetch(`${baseUrl}/${fromCurrency}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
      }

      const data = await response.json();
      const rate = data.rates[toCurrency];

      if (!rate) {
        throw new Error(`Rate not found for ${toCurrency}`);
      }

      return {
        rate,
        source: 'exchangerate-api',
        fetchedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching exchange rate:', error.message);
      throw error;
    }
  },

  /**
   * Get exchange rate (from cache or fetch new)
   */
  async getRate(fromCurrency, toCurrency) {
    // Same currency
    if (fromCurrency === toCurrency) {
      return { rate: 1, cached: true };
    }

    // Check cache
    const cached = await ExchangeRate.findOne({
      where: {
        from_currency: fromCurrency,
        to_currency: toCurrency
      }
    });

    const now = new Date();

    if (cached && new Date(cached.expires_at) > now) {
      return { rate: parseFloat(cached.rate), cached: true };
    }

    // Fetch new rate
    try {
      const result = await this.fetchRateFromAPI(fromCurrency, toCurrency);

      const expiresAt = new Date(now.getTime() + config.currency.cacheExpiryMs);

      // Upsert rate
      await ExchangeRate.upsert({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate: result.rate,
        source: result.source,
        fetched_at: now,
        expires_at: expiresAt
      }, {
        where: {
          from_currency: fromCurrency,
          to_currency: toCurrency
        }
      });

      return { rate: result.rate, cached: false };
    } catch (error) {
      // If API fails and we have expired cache, use it
      if (cached) {
        console.warn('Using expired cached rate due to API failure');
        return { rate: parseFloat(cached.rate), cached: true, expired: true };
      }
      throw error;
    }
  },

  /**
   * Convert amount from one currency to another
   */
  async convert(amount, fromCurrency, toCurrency = 'INR') {
    amount = Math.round(amount);

    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        targetCurrency: toCurrency,
        rate: 1,
        cached: true
      };
    }

    const { rate, cached, expired } = await this.getRate(fromCurrency, toCurrency);
    const convertedAmount = Math.round(amount * rate);

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      targetCurrency: toCurrency,
      rate,
      cached,
      expired: expired || false
    };
  },

  /**
   * Convert to INR specifically used in expenses
   */
  async convertToINR(amount, fromCurrency) {
    if (fromCurrency === 'INR') {
      return {
        amountInr: Math.round(amount),
        rate: 1,
        cached: true
      };
    }

    const result = await this.convert(amount, fromCurrency, 'INR');
    return {
      amountInr: result.convertedAmount,
      rate: result.rate,
      cached: result.cached,
      expired: result.expired
    };
  },

  /**
   * Format currency display
   */
  formatDisplay(amountInPaise, originalAmount, originalCurrency, rate) {
    const formattedInr = `₹${(amountInPaise / 100).toFixed(2)}`;

    if (originalCurrency === 'INR') {
      return formattedInr;
    }

    const currencySymbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹'
    };

    const symbol = currencySymbols[originalCurrency] || originalCurrency;
    const originalFormatted = `${symbol}${(originalAmount / 100).toFixed(2)}`;

    return `${formattedInr} (was ${originalFormatted} @ ${(rate.toFixed(2))})`;
  },

  /**
   * Get all cached rates
   */
  async getAllCachedRates() {
    const rates = await ExchangeRate.findAll({
      order: [['expires_at', 'DESC']]
    });

    return rates.map(r => ({
      from: r.from_currency,
      to: r.to_currency,
      rate: parseFloat(r.rate),
      expiresAt: r.expires_at,
      source: r.source
    }));
  },

  /**
   * Clear expired rates
   */
  async clearExpiredRates() {
    const result = await ExchangeRate.destroy({
      where: {
        expires_at: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });

    return result;
  }
};

module.exports = currencyService;
