// Using Polygon.io api to get stock data

const axios = require('axios');

const API_KEY = 'CBVjm3hwPpG1TWbxijmCep08XW8d8Y0M';

// Get historical prices from Polygon.io
async function getHistoricalPrices(symbol) {
  try {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateFormatted = startDate.toISOString().slice(0, 10);
    const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDateFormatted}/${endDate}?apiKey=${API_KEY}`);
    console.log('Response:', response.data);
    const dailyData = response.data.results;
    if (dailyData && dailyData.length >= 5) {
      // Format data for chart
      const formattedData = dailyData.map((data) => ({
        x: new Date(data.t),
        y: parseFloat(data.c),
      }));
      formattedData.reverse();
      console.log('Historical Prices:', formattedData);
      return formattedData;
    }
    throw new Error('Insufficient data for historical prices');
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw new Error('Error fetching historical prices');
  }
}

module.exports = {
  getHistoricalPrices,
};
