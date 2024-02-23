// yahooAPI.js

const YahooStockAPI = require('yahoo-stock-api').default;

const yahoo = new YahooStockAPI();

async function getHistoricalPrices(symbol) {
  try {
    const historicalPrices = await yahoo.getHistoricalPrices({
      startDate: new Date('08/21/2020'),
      endDate: new Date('08/26/2020'),
      symbol,
      frequency: '1d',
    });
    return historicalPrices;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw new Error('Error fetching historical prices');
  }
}

async function getSymbolInfo(symbol) {
  try {
    const symbolInfo = await yahoo.getSymbol({ symbol });
    return symbolInfo;
  } catch (error) {
    console.error('Error fetching symbol info:', error);
    throw new Error('Error fetching symbol info');
  }
}

module.exports = {
  getHistoricalPrices,
  getSymbolInfo,
};
