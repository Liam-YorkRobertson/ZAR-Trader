// Controls graph rendering, wallet functionality, and stock purchasing 

document.addEventListener('DOMContentLoaded', async () => {
  const selectedStock = document.getElementById('stock-dropdown').value;
  fetchAndRender(selectedStock);
  // Updates wallet value for Navbar
  updateWallet();
});

document.getElementById('sign-out-button').addEventListener('click', function() {
  window.location.href = 'landing.html';
});

// Handle stock selection from dropdown
function handleSelect() {
  const selectedStock = document.getElementById('stock-dropdown').value;
  fetchAndRender(selectedStock);
}

// Fetch historical prices and render graph
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
    displayErrorMessage('An error occurred while fetching historical prices. Please try again later.');
  }
}

// Render graph based on provided data
function renderGraph(data) {
  try {
    // Extract y-axis values (closing prices)
    const formattedData = data.map((price) => ({
      x: formatDayOfWeek(price.x),
      value: price.y,
    }));
    formattedData.reverse();
    // Calculate high and low of week
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
    chartContainer.innerHTML = '';

    // Configure and render graph
    anychart.onDocumentReady(() => {
      const chart = anychart.line();
      chart.line().stroke('green');
      chart.data(formattedData);
      chart.title('Stock Prices');
      chart.xAxis().labels().format(function () {
        return this.value;
      });
      chart.xAxis().title('Time');
      chart.yAxis().title('Price');
      chart.tooltip().format(function () {
        return `${this.value}`;
      });
      chart.yScale().minimum(low).maximum(high);
      
      chart.container('chart-container');
      chart.draw();
    });
  } catch (error) {
    console.error('Error rendering graph:', error);
    displayErrorMessage('An error occurred while rendering the graph. Please try again later.');
  }
}

// Format date as abbreviated day
function formatDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getDay()];
}

// Open wallet container
function openWallet() {
  const walletContainer = document.getElementById('wallet-container');
  walletContainer.classList.remove('hidden');
  updateWallet();
}

// Close wallet container
function closeWallet() {
  const walletContainer = document.getElementById('wallet-container');
  walletContainer.classList.add('hidden');
}

// Update wallet information
async function updateWallet() {
  try {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      displayErrorMessage('User email not found in cache. Please sign in again.');
      return;
    }
    const response = await fetch(`/get-wallet?email=${userEmail}`, {
      method: 'GET',
    });
    const data = await response.json();
    const formattedWalletValue = parseFloat(data.wallet).toFixed(2);
    const walletValueNavbar = document.getElementById('wallet-value-navbar');
    walletValueNavbar.textContent = `$${formattedWalletValue}`;
    const walletValueModal = document.getElementById('wallet-value-modal');
    walletValueModal.textContent = `$${formattedWalletValue}`;
  } catch (error) {
    console.error('Error updating wallet:', error);
    displayErrorMessage('An error occurred while updating wallet amount. Please try again later.');
  }
}

// Deposit funds into wallet
async function deposit() {
  const amount = parseInt(document.getElementById('transaction-amount').value);
  if (isNaN(amount) || amount <= 0 || amount > 10000) {
    displayAlert('Invalid amount! Please enter a valid amount.');
    return;
  }
  try {
    const email = localStorage.getItem('userEmail');
    const response = await fetch(`/deposit?email=${email}&amount=${amount}`, {
      method: 'GET',
    });
    if (response.ok) {
      displayAlert('Deposit successful!');
      updateWallet();
    } else {
      displayAlert('Deposit failed! Please try again.');
    }
  } catch (error) {
    console.error('Error depositing:', error);
    displayErrorMessage('An error occurred while depositing. Please try again later.');
  }
}

// Withdraw funds from wallet
async function withdraw() {
  const amount = parseInt(document.getElementById('transaction-amount').value);
  if (isNaN(amount) || amount <= 0 || amount > 10000) {
    displayAlert('Invalid amount! Please enter a valid amount.');
    return;
  }
  try {
    const email = localStorage.getItem('userEmail');
    const response = await fetch(`/withdraw?email=${email}&amount=${amount}`, {
      method: 'GET',
    });
    if (response.ok) {
      displayAlert('Withdrawal successful!');
      updateWallet();
    } else {
      displayAlert('Withdrawal failed! Please try again.');
    }
  } catch (error) {
    console.error('Error withdrawing:', error);
    displayErrorMessage('An error occurred while withdrawing. Please try again later.');
  }
}

// Open buy modal and fetch stock information
async function openBuyModal() {
  try {
    const symbol = document.getElementById('stock-dropdown').value;
    // Fetch historical prices
    const response = await fetch(`/historical-prices/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock information');
    }
    const data = await response.json();
    // Extract from fetched data
    const latestPrice = data[0]?.y;
    const stockName = document.getElementById('stock-dropdown').options[document.getElementById('stock-dropdown').selectedIndex].text;
    const userEmail = localStorage.getItem('userEmail');
    const investmentsResponse = await fetch(`/user-investments?email=${userEmail}`);
    let stockOwned = 0;
    if (investmentsResponse.ok) {
      const investmentsData = await investmentsResponse.json();
      // Sum up stock amounts for all investments
      stockOwned = investmentsData.reduce((total, investment) => {
        if (investment.stock_name === stockName) {
          return total + investment.stock_amount;
        }
        return total;
      }, 0);
    } else {
      console.error('Failed to fetch user investments');
    }
    document.getElementById('stock-name').innerText = stockName;
    document.getElementById('latest-price').innerText = latestPrice;
    document.getElementById('stock-owned').innerText = stockOwned;
    // Display buy modal
    const modal = document.getElementById('buy-modal');
    modal.style.display = 'block';
  } catch (error) {
    console.error('Error opening buy modal:', error);
    displayErrorMessage('An error occurred while opening the buy modal. Please try again later.');
  }
}

// Close buy modal
function closeBuyModal() {
  const modal = document.getElementById('buy-modal');
  modal.style.display = 'none';
}

// Confirm buy
async function confirmBuy() {
  const user_email = localStorage.getItem('userEmail');
  const stock_name = document.getElementById('stock-name').innerText;
  const date_bought = new Date();
  const price = parseFloat(document.getElementById('latest-price').innerText);
  const stock_amount = parseInt(document.getElementById('buy-amount').value);
  try {

    const walletResponse = await fetch(`/get-wallet?email=${user_email}`);
    if (!walletResponse.ok) {
      throw new Error('Failed to fetch wallet balance');
    }

    const walletData = await walletResponse.json();
    const walletBalance = walletData.wallet;
    const totalCost = price * stock_amount;
    if (walletBalance < totalCost) {
      displayAlert('Insufficient funds in wallet. Please deposit more funds.');
      return;
    }
    const response = await fetch('/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email, stock_name, date_bought, price, stock_amount,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      // Update balance after purchase
      const updatedBalance = walletBalance - totalCost;
      document.getElementById('wallet-value-navbar').textContent = `$${updatedBalance.toFixed(2)}`;
      document.getElementById('wallet-value-modal').textContent = `$${updatedBalance.toFixed(2)}`;
      await updateWalletBalance(user_email, totalCost);
      displayAlert(data.message);
      closeBuyModal();
      updateTotalInvestment();
    } else {
      displayAlert('Failed to buy stocks. Please try again later.');
    }
  } catch (error) {
    console.error('Error confirming buy:', error);
    displayErrorMessage('An error occurred. Please try again later.');
  }
}

// Update wallet balance in database
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
    displayErrorMessage('An error occurred while updating wallet balance. Please try again later.');
  }
}

// Update total investment
function updateTotalInvestment() {
  const price = parseFloat(document.getElementById('latest-price').innerText);
  const stock_amount = parseInt(document.getElementById('buy-amount').value);
  const totalAmount = price * stock_amount;
  document.getElementById('total-investment').innerText = totalAmount.toFixed(2);
}
document.getElementById('buy-amount').addEventListener('input', updateTotalInvestment);

// Open sell modal
function openSellModal() {
  const sellModal = document.getElementById('sell-modal');
  sellModal.style.display = 'block';
}

// Close the sell modal
function closeSellModal() {
  const sellModal = document.getElementById('sell-modal');
  sellModal.style.display = 'none';
}

// Confirm the sale
function confirmSell() {
  window.location.href = 'portfolio.html';
}

// Display error message
function displayErrorMessage(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 1500);
}

// Display alert
function displayAlert(message) {
  const alertMessage = document.getElementById('error-message');
  alertMessage.textContent = message;
  alertMessage.style.display = 'block';
  setTimeout(() => {
    alertMessage.style.display = 'none';
  }, 1500);
}
