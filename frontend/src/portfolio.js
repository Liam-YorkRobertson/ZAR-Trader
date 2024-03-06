// Functionality of sale of stocks 

document.addEventListener('DOMContentLoaded', async () => {
  await displayWallet();
  await displayPortfolio();
});

document.getElementById('sign-out-button').addEventListener('click', function() {
  window.location.href = 'landing.html';
});

document.getElementById('homepage-button').addEventListener('click', function() {
  window.location.href = 'homepage.html';
});

// Fetches and displays the wallet information
async function displayWallet() {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`/get-wallet?email=${userEmail}`);
    const data = await response.json();
    const walletValue = document.getElementById('wallet-value');
    const formattedWalletValue = parseFloat(data.wallet).toFixed(2);
    walletValue.textContent = `Wallet: $${formattedWalletValue}`;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    displayAlert('An error occurred while fetching wallet information. Please try again later.');
  }
}

// Formats date object
function formatDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} - ${date.toLocaleTimeString('en-US', { hour12: false })}`;
}

// Fetches and displays portfolio information
async function displayPortfolio() {
  try {
    const userEmail = localStorage.getItem('userEmail');
    const response = await fetch(`/user-investments?email=${userEmail}`);
    const investmentsData = await response.json();
    const companyList = document.getElementById('company-list');
    // Group investments by company
    const groupedInvestments = {};
    investmentsData.forEach((investment) => {
      if (!groupedInvestments[investment.stock_name]) {
        groupedInvestments[investment.stock_name] = [];
      }
      groupedInvestments[investment.stock_name].push(investment);
    });
    // Render investments for each company
    for (const company in groupedInvestments) {
      const investments = groupedInvestments[company];
      const companyElement = document.createElement('div');
      companyElement.classList.add('company');
      // Add company name
      const companyName = document.createElement('h3');
      companyName.textContent = company;
      companyElement.appendChild(companyName);
      // Reveals investments
      const revealButton = document.createElement('button');
      revealButton.textContent = '+';
      revealButton.classList.add('reveal-details-btn');
      revealButton.onclick = function() {
        revealInvestmentDetails(this);
      };
      companyElement.appendChild(revealButton);
      // Add investment details container
      const investmentDetailsContainer = document.createElement('div');
      investmentDetailsContainer.classList.add('investment-details', 'hidden');
      companyElement.appendChild(investmentDetailsContainer);
      // Add investment details
      for (const investment of investments) {
        const dateBought = new Date(investment.date_bought);
        const formattedDate = formatDate(dateBought);
        const investmentDetails = document.createElement('div');
        investmentDetails.textContent = `Date Purchased: ${formattedDate} | Stocks Owned: ${investment.stock_amount} | Purchased Price: ${investment.price}`;
        // Add "Sell" button for each
        const sellButton = document.createElement('button');
        sellButton.textContent = 'Sell';
        sellButton.classList.add('sell-btn');
        sellButton.onclick = function() {
          openSellModal(investment);
        };
        investmentDetails.appendChild(sellButton);
        investmentDetailsContainer.appendChild(investmentDetails);
      }
      companyList.appendChild(companyElement);
    }
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    displayAlert('An error occurred while fetching portfolio information. Please try again later.');
  }
}
 // Toggles visibility of investment details
function revealInvestmentDetails(button) {
  const detailsContainer = button.nextElementSibling;
  detailsContainer.classList.toggle('hidden');
  button.textContent = button.textContent === '+' ? '-' : '+';
}
 // Opens sell modal and fetches data
async function openSellModal(investment) {
  try {
    const companyName = investment.stock_name;
    const companySymbolMap = {
      'Microsoft Corporation': 'MSFT',
      'Apple Inc.': 'AAPL',
      'NVIDIA Corporation': 'NVDA',
      'Amazon.com, Inc.': 'AMZN',
      'Alphabet Inc.': 'GOOG',
      'Meta Platforms, Inc.': 'META',
      'Tesla, Inc.': 'TSLA',
      'JPMorgan Chase & Co.': 'JPM',
      'Exxon Mobil Corporation': 'XOM',
      'Johnson & Johnson': 'JNJ',
      'The Procter & Gamble Company': 'PG',
      'The Home Depot, Inc.': 'HD',
      'Advanced Micro Devices, Inc.': 'AMD',
      'Bank of America Corporation': 'BAC',
      'The Coca-Cola Company': 'KO',
      'Netflix, Inc.': 'NFLX',
      'McDonald\'s Corporation': 'MCD',
      'The Walt Disney Company': 'DIS',
      'Cisco Systems, Inc.': 'CSCO',
      'Alibaba Group Holding Limited': 'BABA',
      'Intel Corporation': 'INTC',
      'International Business Machines Corporation': 'IBM',
      'General Electric Company': 'GE',
      'Verizon Communications Inc.': 'VZ',
      'Walmart Inc.': 'WMT',
      'Pfizer Inc.': 'PFE',
      'The Boeing Company': 'BA',
      'AT&T Inc.': 'T',
      'Citigroup Inc.': 'C',
      'Ford Motor Company': 'F'
    };
    const symbol = companySymbolMap[companyName];
    if (!symbol) {
      throw new Error('Symbol not found for company');
    }
    console.log('Company Name:', companyName);
    console.log('Symbol:', symbol);
    // Fetch historical prices
    const response = await fetch(`/historical-prices/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch historical prices');
    }
    const historicalPrices = await response.json();
    console.log('Historical Prices:', historicalPrices);
    if (!historicalPrices || historicalPrices.length === 0) {
      throw new Error('Historical prices data not available');
    }
    // Get latest close price
    const latestClosePrice = historicalPrices[0]?.y;
    console.log('Latest Close Price:', latestClosePrice);
    const maxAmount = parseInt(investment.stock_amount);
    document.getElementById('sell-price').textContent = latestClosePrice.toFixed(2);
    // Update sell modal
    const sellAmountInput = document.getElementById('sell-amount-input');
    sellAmountInput.value = maxAmount;
    sellAmountInput.setAttribute('max', maxAmount);
    updateSellModal(investment, latestClosePrice);
    // event listener to input field to update modal
    sellAmountInput.addEventListener('input', () => {
      const enteredValue = parseInt(sellAmountInput.value);
      if (isNaN(enteredValue) || enteredValue < 0) {
        sellAmountInput.value = 0;
      } else if (enteredValue > maxAmount) {
        sellAmountInput.value = maxAmount;
      }
      updateSellModal(investment, latestClosePrice);
    });
    const sellModal = document.getElementById('sell-modal');
    sellModal.style.display = 'block';
    document.getElementById('confirm-sell-button').onclick = function() {
      confirmSell(investment, latestClosePrice);
    };
  } catch (error) {
    console.error('Error opening sell modal:', error);
    displayAlert('An error occurred while opening the sell modal. Please try again later.');
  }
}

// Updates the sell modal with user input
function updateSellModal(investment, latestClosePrice) {
  const sellAmountInput = document.getElementById('sell-amount-input');
  const sellAmount = parseInt(sellAmountInput.value);
  const totalAmount = sellAmount * latestClosePrice;
  const profitPercentage = (((latestClosePrice - investment.price) / investment.price) * 100);
  const profitAmount = (latestClosePrice - investment.price) * sellAmount; // Calculate dollar amount of profit/loss
  const profitIndicator = profitAmount >= 0 ? '+' : '-';
  const profitPercentageFormatted = Math.abs(profitPercentage).toFixed(2);
  const profitAmountFormatted = Math.abs(profitAmount).toFixed(2);
  const profitMessage = document.getElementById('profit-amount');
  profitMessage.textContent = `${profitIndicator}${profitPercentageFormatted}% | ${profitIndicator}$${profitAmountFormatted}`;
  // Apply styling based on profit/loss
  if (profitAmount > 0) {
    profitMessage.style.color = 'green';
  } else if (profitAmount < 0) {
    profitMessage.style.color = 'red';
  } else {
    profitMessage.style.color = 'black';
  }
  document.getElementById('total-amount').textContent = totalAmount.toFixed(2); // Round total amount to 2 decimal places
}

// Closes sell modal
function closeSellModal() {
  const sellModal = document.getElementById('sell-modal');
  sellModal.style.display = 'none';
}

// Confirms the sale of stock and updates wallet
async function confirmSell(investment, latestClosePrice) {
  try {
    const { stock_name: stockName, date_bought: dateBought, stock_amount: stockAmount } = investment;
    const sellAmount = parseInt(document.getElementById('sell-amount-input').value);
    let totalPrice = sellAmount * latestClosePrice;
    totalPrice = Math.round(totalPrice * 100) / 100;
    if (isNaN(stockAmount) || stockAmount <= 0) {
      throw new Error('Invalid stock amount');
    }
    console.log('Request Body:', { stockName, dateBought, stockAmount, totalPrice });
    const response = await fetch('http://localhost:3000/reduce-stock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stockName,
        dateBought,
        amount: sellAmount
      })
    });
    if (!response.ok) {
      throw new Error('Failed to reduce stock amount');
    }
    const userEmail = localStorage.getItem('userEmail');
    const walletResponse = await fetch('http://localhost:3000/increase-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: totalPrice,
        userEmail: userEmail
      })
    });
    if (!walletResponse.ok) {
      throw new Error('Failed to increase wallet amount');
    }
    // Update wallet balance display
    const currentWalletBalance = parseFloat(document.getElementById('wallet-value').textContent.replace('Wallet: $', ''));
    const updatedWalletBalance = currentWalletBalance + totalPrice;
    document.getElementById('wallet-value').textContent = `Wallet: $${updatedWalletBalance.toFixed(2)}`;
    // Show sale successful message
    displayAlert('Sale successful!');
    setTimeout(() => {
      window.location.href = 'portfolio.html';
    }, 1500);
  } catch (error) {
    console.error('Error processing sale:', error);
    displayErrorMessage('An error occurred while processing your request. Please try again later.');
  }
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
