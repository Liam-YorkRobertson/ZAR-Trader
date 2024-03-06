// Using alpha vantage API to get stock data
const axios = require('axios');

const API_KEY = 'D7K06C1RR43NPMI2';

// Get historical prices from alpha vantage
async function getHistoricalPrices(symbol) {
  try {
    const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`);
    const dailyData = response.data['Time Series (Daily)'];
    const dates = Object.keys(dailyData).slice(0, 5);
    // Format data for chart
    const formattedData = dates.map((date) => ({
      x: new Date(date),
      y: parseFloat(dailyData[date]['4. close']),
    }));
    console.log('Historical Prices:', formattedData);
    return formattedData;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw new Error('Error fetching historical prices');
  }
}

module.exports = {
  getHistoricalPrices,
};
