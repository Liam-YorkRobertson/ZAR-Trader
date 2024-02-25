document.addEventListener('DOMContentLoaded', async () => {
  const chartContainer = document.getElementById('chart-container');

  try {
    // Fetch historical prices for S&P 500
    const response = await fetch('/historical-prices/^GSPC');

    if (!response.ok) {
      throw new Error('Failed to fetch historical prices');
    }

    const responseData = await response.json();

    // Check if the response contains valid data
    if (!responseData || !Array.isArray(responseData)) {
      throw new Error('Invalid response format');
    }

    console.log('Historical Prices:', responseData);

    // Render the graph
    renderGraph(responseData);
  } catch (error) {
    console.error('Error fetching or processing historical prices:', error);
    alert('An error occurred while fetching historical prices. Please try again later.');
  }
});

function renderGraph(data) {
  try {
    // Extract x-axis labels (dates) and y-axis values (closing prices)
    const formattedData = data.map((price) => ({
      x: price.x,
      value: price.y
    }));

    // Calculate the high and low of the week
    const values = formattedData.map((price) => price.value);
    const high = Math.max(...values) + 10;
    const low = Math.min(...values) - 10;

    // Configure and render the graph using AnyChart
    anychart.onDocumentReady(() => {
      const chart = anychart.line(); // Create a line chart

      // Set chart data
      chart.data(formattedData);

      // Set chart title
      chart.title('S&P 500 Historical Prices');

      // Set x-axis labels
      chart.xAxis().labels().format(function() {
        return this.value['x'];
      });

      // Set y-axis scale
      chart.yScale().minimum(low).maximum(high);

      // Render the chart to the container
      chart.container('chart-container');
      chart.draw();
    });
  } catch (error) {
    console.error('Error rendering graph:', error);
    alert('An error occurred while rendering the graph. Please try again later.');
  }
}
