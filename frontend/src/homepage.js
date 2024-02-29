document.addEventListener('DOMContentLoaded', async () => {
  // Fetch historical prices for the selected stock on page load
  const selectedStock = document.getElementById('stock-dropdown').value;
  fetchAndRender(selectedStock);
});

// Function to handle stock selection from dropdown
function handleSelect() {
  const selectedStock = document.getElementById('stock-dropdown').value;
  fetchAndRender(selectedStock);
}

// Function to fetch historical prices and render the graph
async function fetchAndRender(symbol) {
  try {
    const response = await fetch(`/historical-prices/${symbol}`);

    if (!response.ok) {
      throw new Error('Failed to fetch historical prices');
    }

    const responseData = await response.json();

    if (!responseData || !Array.isArray(responseData)) {
      throw new Error('Invalid response format');
    }

    renderGraph(responseData);
  } catch (error) {
    console.error('Error fetching or processing historical prices:', error);
    alert('An error occurred while fetching historical prices. Please try again later.');
  }
}

function renderGraph(data) {
  try {
    // Extract y-axis values (closing prices)
    const formattedData = data.map((price) => ({
      x: formatDayOfWeek(price.x), // Format x-axis label to display abbreviated day of the week
      value: price.y,
    }));

    // Reverse the order of the formatted data
    formattedData.reverse();

    // Calculate the high and low of the week
    const values = formattedData.map((price) => price.value);
    function calculatePercentile(data, percentile) {
      const sortedData = data.slice().sort((a, b) => a - b);
      const index = (percentile / 100) * (sortedData.length - 1);
      return Number.isInteger(index)
        ? sortedData[index]
        : (sortedData[Math.floor(index)] + sortedData[Math.ceil(index)]) / 2;
    }

    const high = Math.ceil(calculatePercentile(values, 99) * 1.02);
    const low = Math.floor(calculatePercentile(values, 1) * 0.98);

    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = ''; // Clear the chart container

    // Configure and render the graph using AnyChart
    anychart.onDocumentReady(() => {
      const chart = anychart.line(); // Create a line chart

      // Set chart data
      chart.data(formattedData);

      // Set chart title
      chart.title('Stock Prices');

      // Set x-axis labels to display abbreviated days of the week
      chart.xAxis().labels().format(function () {
        return this.value;
      });

      // Set x-axis title
      chart.xAxis().title('Time');

      // Set y-axis title
      chart.yAxis().title('Price');

      // Set tooltip format
      chart.tooltip().format(function () {
        return `${this.value}`;
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

// Function to format the date as abbreviated day of the week
function formatDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getDay()];
}

// wallet functionality


function openWallet() {
  const walletContainer = document.getElementById('wallet-container');
  walletContainer.classList.remove('hidden');
  updateWallet(); // Update wallet amount when opening
}

function closeWallet() {
  const walletContainer = document.getElementById('wallet-container');
  walletContainer.classList.add('hidden');
}

async function updateWallet() {
  try {
    const userEmail = localStorage.getItem('userEmail'); // Retrieve user email from cache
    if (!userEmail) {
      alert('User email not found in cache. Please sign in again.');
      return;
    }
    const response = await fetch(`/get-wallet?email=${userEmail}`, {
      method: 'GET',
    });
    const data = await response.json();
    const walletValue = document.getElementById('wallet-value');
    walletValue.textContent = `Wallet: $${data.wallet}`;
  } catch (error) {
    console.error('Error updating wallet:', error);
    alert('An error occurred while updating wallet amount. Please try again later.');
  }
}

async function deposit() {
  const amount = parseInt(document.getElementById('transaction-amount').value);
  if (isNaN(amount) || amount <= 0 || amount > 10000) {
    alert('Invalid amount! Please enter a valid amount.');
    return;
  }

  try {
    const email = localStorage.getItem('userEmail'); // Retrieve user's email from cache
    const response = await fetch(`/deposit?email=${email}&amount=${amount}`, {
      method: 'GET', // Change method to GET
    });
    if (response.ok) {
      alert('Deposit successful!');
      updateWallet();
    } else {
      alert('Deposit failed! Please try again.');
    }
  } catch (error) {
    console.error('Error depositing:', error);
    alert('An error occurred while depositing. Please try again later.');
  }
}

async function withdraw() {
  const amount = parseInt(document.getElementById('transaction-amount').value);
  if (isNaN(amount) || amount <= 0 || amount > 10000) {
    alert('Invalid amount! Please enter a valid amount.');
    return;
  }

  try {
    const email = localStorage.getItem('userEmail'); // Retrieve user's email from cache
    const response = await fetch(`/withdraw?email=${email}&amount=${amount}`, {
      method: 'GET', // Change method to GET
    });
    if (response.ok) {
      alert('Withdrawal successful!');
      updateWallet();
    } else {
      alert('Withdrawal failed! Please try again.');
    }
  } catch (error) {
    console.error('Error withdrawing:', error);
    alert('An error occurred while withdrawing. Please try again later.');
  }
}
