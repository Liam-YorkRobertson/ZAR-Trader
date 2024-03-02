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

    console.log('Response data:', responseData);

    if (!responseData || !Array.isArray(responseData)) {
      throw new Error('Invalid response format');
    }

    const first5DaysData = responseData.slice(0, 5);

    renderGraph(first5DaysData);
  } catch (error) {
    console.error('Error fetching or processing historical prices:', error);
    alert('An error occurred while fetching historical prices. Please try again later.');
  }
}

function renderGraph(data) {
  try {
    // Extract y-axis values (closing prices)
    const formattedData = data.map((price) => ({
      x: formatDayOfWeek(price.x),
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

// Function to open the buy modal and fetch stock information
async function openBuyModal() {
  try {
    const symbol = document.getElementById('stock-dropdown').value;

    // Fetch historical prices for the selected stock
    const response = await fetch(`/historical-prices/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock information');
    }
    const data = await response.json();

    // Extract necessary information from the fetched data
    const latestPrice = data[0]?.y; // Assuming the latest price is the first item in the response array
    const stockName = document.getElementById('stock-dropdown').options[document.getElementById('stock-dropdown').selectedIndex].text; // Get the stock name from the dropdown

    // Fetch user investments
    const userEmail = localStorage.getItem('userEmail');
    const investmentsResponse = await fetch(`/user-investments?email=${userEmail}`);
    let stockOwned = 0;
    if (investmentsResponse.ok) {
      const investmentsData = await investmentsResponse.json();
      const userInvestment = investmentsData.find(investment => investment.stock_name === stockName);
      stockOwned = userInvestment ? userInvestment.stock_amount : 0; // Set stock owned to 0 if user doesn't own any stocks
    } else {
      console.error('Failed to fetch user investments');
    }

    // Populate the buy modal with fetched data
    document.getElementById('stock-name').innerText = stockName;
    document.getElementById('latest-price').innerText = latestPrice;
    document.getElementById('stock-owned').innerText = stockOwned;

    // Display the buy modal
    const modal = document.getElementById('buy-modal');
    modal.style.display = 'block';
  } catch (error) {
    console.error('Error opening buy modal:', error);
    alert('An error occurred while opening the buy modal. Please try again later.');
  }
}

// Function to close the buy modal
function closeBuyModal() {
  const modal = document.getElementById('buy-modal');
  modal.style.display = 'none';
}

// Function to confirm the buy
async function confirmBuy() {
  const user_email = localStorage.getItem('userEmail');
  const stock_name = document.getElementById('stock-name').innerText;
  const date_bought = new Date();
  const price = parseFloat(document.getElementById('latest-price').innerText);
  const stock_amount = parseInt(document.getElementById('buy-amount').value);

  try {
    // Fetch user's wallet balance
    const walletResponse = await fetch(`/get-wallet?email=${user_email}`);
    if (!walletResponse.ok) {
      throw new Error('Failed to fetch wallet balance');
    }
    const walletData = await walletResponse.json();
    const walletBalance = walletData.wallet;

    // Calculate total cost of the purchase
    const totalCost = price * stock_amount;

    // Check if the wallet balance is sufficient for the purchase
    if (walletBalance < totalCost) {
      alert('Insufficient funds in wallet. Please deposit more funds.');
      return;
    }

    // Proceed with the purchase if the wallet balance is sufficient
    const response = await fetch('/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email, stock_name, date_bought, price, stock_amount,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      // Update wallet balance after successful purchase
      const updatedBalance = walletBalance - totalCost;
      document.getElementById('wallet-value').textContent = `Wallet: $${updatedBalance}`;

      // Update wallet balance in the database
      await updateWalletBalance(user_email, totalCost);

      alert(data.message);
      closeBuyModal();
      updateTotalInvestment(); // Update total investment amount after buying
    } else {
      alert('Failed to buy stocks. Please try again later.');
    }
  } catch (error) {
    console.error('Error confirming buy:', error);
    alert('An error occurred. Please try again later.');
  }
}

// Function to update wallet balance in the database
async function updateWalletBalance(email, totalCost) {
  try {
    const response = await fetch('/update-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, totalCost }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    alert('An error occurred while updating wallet balance. Please try again later.');
  }
}

// Function to update total investment amount
function updateTotalInvestment() {
  const price = parseFloat(document.getElementById('latest-price').innerText);
  const stock_amount = parseInt(document.getElementById('buy-amount').value);
  const totalAmount = price * stock_amount;
  document.getElementById('total-investment').innerText = totalAmount.toFixed(2);
}

// Event listener for input field of number of stocks to buy
document.getElementById('buy-amount').addEventListener('input', updateTotalInvestment);
