// yahooAPI.js

const YahooStockAPI = require('yahoo-stock-api').default;

const yahoo = new YahooStockAPI();

async function getHistoricalPrices(symbol) {
  try {
    const today = new Date(); // Get today's date
    const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5); // Set the date to one week ago

    // Fetch historical prices from Yahoo Finance API for the specified symbol
    const response = await yahoo.getHistoricalPrices({
      startDate: oneWeekAgo,
      endDate: today,
      symbol: symbol, // Use the provided symbol
      frequency: '1d', // Set frequency to "1d" for daily prices
    });

    console.log('Historical Prices:', response); // Log response

    // Check if there is an error in the response
    if (response.error) {
      throw new Error(response.message); // Throw an error if there is an error in the response
    }

    // Extract historical prices array from the response
    const historicalPrices = response.response;

    // Format data for charting library
    const formattedData = historicalPrices.map((price) => ({
      x: new Date(price.date * 1000), // Convert Unix timestamp to JavaScript Date object
      y: price.close, // Use closing price as the y-axis value
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
