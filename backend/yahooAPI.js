// Uses yahoo finance api to get stock data

const YahooStockAPI = require('yahoo-stock-api').default;

const yahoo = new YahooStockAPI();

// Gets information form yahoo finance api
async function getHistoricalPrices(symbol) {
  try {
    const today = new Date();
    const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
    const response = await yahoo.getHistoricalPrices({
      startDate: oneWeekAgo,
      endDate: today,
      symbol,
      frequency: '1d',
    });
    console.log('Historical Prices:', response);
    if (response.error) {
      throw new Error(response.message);
    }
    // Extract historical prices array from response
    const historicalPrices = response.response;
    // Filter out weekend entries
    const filteredPrices = historicalPrices.filter(price => {
      const priceDate = new Date(price.date * 1000);
      return priceDate.getDay() !== 0 && priceDate.getDay() !== 6;
    });
    // Format data for charting library
    const formattedData = filteredPrices.map(price => ({
      x: new Date(price.date * 1000),
      y: price.close,
    }));
    return formattedData;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw new Error('Error fetching historical prices');
  }
}

module.exports = {
  getHistoricalPrices,
};
