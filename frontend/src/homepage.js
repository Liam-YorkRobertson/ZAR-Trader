// homepage.js

document.addEventListener('DOMContentLoaded', () => {
  const addButton = document.getElementById('add-button');
  const stockDropdown = document.getElementById('stock-dropdown');
  const graphContainer = document.getElementById('graph-container');

  // Event listener for the + button
  addButton.addEventListener('click', async () => {
    try {
      // Make AJAX request to fetch list of all stocks
      const response = await fetch('/stocks');
      const stocks = await response.json();

      // Populate the dropdown menu with the list of stocks
      stockDropdown.innerHTML = '';
      stocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.symbol;
        option.textContent = `${stock.symbol} - ${stock.name}`;
        stockDropdown.appendChild(option);
      });
    } catch (error) {
      console.error('Error fetching stocks:', error);
      alert('An error occurred while fetching stocks. Please try again later.');
    }
  });

  // Event listener for selecting a stock from the dropdown
  stockDropdown.addEventListener('change', async () => {
    const selectedSymbol = stockDropdown.value;
    try {
      // Make AJAX request to fetch historical prices for the selected stock
      const response = await fetch(`/historical-prices/${selectedSymbol}`);
      const historicalPrices = await response.json();

      // Render the graph using a charting library (e.g., Chart.js)
      renderGraph(historicalPrices);
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      alert('An error occurred while fetching historical prices. Please try again later.');
    }
  });

  // Function to render the graph using a charting library
  function renderGraph(data) {
    // Your code to render the graph goes here
    // Use a charting library like Chart.js or AnyChart
  }
});
