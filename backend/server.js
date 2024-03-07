// server handles requests and responses

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
const { getHistoricalPrices } = require('./stockDataApi');
const UserWallet = require('./models/userWallet');
const UserInvestment = require('./models/userInvestment');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint for sign up
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // Create new user
    const newUser = new User({ username, email, password });
    await newUser.save();
    // Check if wallet exists
    const existingWallet = await UserWallet.findOne({ email });
    if (!existingWallet) {
      // Create wallet
      const userWallet = new UserWallet({ email, wallet: 0 });
      await userWallet.save();
    }
    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for sign in
app.post('/signin', async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  try {
    // Check if user exists
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail },
      ],
    });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    res.status(200).json({ message: 'Sign-in successful', email: user.email });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for fetching historical prices
app.get('/historical-prices/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    // Fetch historical prices for requested symbol
    const historicalPrices = await getHistoricalPrices(symbol);
    res.json(historicalPrices);
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to deposit into wallet
app.get('/deposit', async (req, res) => {
  const { email, amount } = req.query;
  try {
    const userWallet = await UserWallet.findOne({ email });
    if (!userWallet) {
      return res.status(404).json({ error: 'User not found or wallet does not exist' });
    }
    // Update user wallet
    userWallet.wallet += parseInt(amount);
    await userWallet.save();
    res.status(200).json({ message: 'Deposit successful' });
  } catch (error) {
    console.error('Error depositing into wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to withdraw from wallet
app.get('/withdraw', async (req, res) => {
  const { email, amount } = req.query;
  try {
    const userWallet = await UserWallet.findOne({ email });
    if (!userWallet) {
      return res.status(404).json({ error: 'User not found or wallet does not exist' });
    }
    if (userWallet.wallet < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    // Update user wallet
    userWallet.wallet -= parseInt(amount);
    await userWallet.save();
    res.status(200).json({ message: 'Withdrawal successful' });
  } catch (error) {
    console.error('Error withdrawing from wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get wallet amount
app.get('/get-wallet', async (req, res) => {
  const { email } = req.query;
  try {
    // Retrieve user wallet data
    const userWallet = await UserWallet.findOne({ email });
    if (userWallet) {
      res.status(200).json({ wallet: userWallet.wallet });
    } else {
      res.status(200).json({ wallet: 0 });
    }
  } catch (error) {
    console.error('Error fetching wallet amount:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to fetch user investments
app.get('/user-investments', async (req, res) => {
  const { email } = req.query;
  try {
    // Fetch investments for user email
    const userInvestments = await UserInvestment.find({ user_email: email });
    if (userInvestments.length === 0) {
      // If no investments return empty array
      return res.status(200).json([]);
    }
    res.status(200).json(userInvestments);
  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for buying stocks
app.post('/buy', async (req, res) => {
  const {
    user_email, stock_name, date_bought, price, stock_amount,
  } = req.body;
  try {
    // User has enough funds in wallet
    const userWallet = await UserWallet.findOne({ email: user_email });
    if (!userWallet) {
      return res.status(400).json({ error: 'User wallet not found' });
    }
    const totalCost = price * stock_amount;
    if (userWallet.wallet < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds in wallet' });
    }
    // Check if existing investment made simultaneously
    const existingInvestment = await UserInvestment.findOne({
      user_email,
      stock_name,
      date_bought,
    });
    if (existingInvestment) {
      // If investment already exists, increase stock_amount
      existingInvestment.stock_amount += stock_amount;
      await existingInvestment.save();
    } else {
      // Create new investment
      const userInvestment = new UserInvestment({
        user_email,
        stock_name,
        date_bought,
        price,
        stock_amount,
      });
      await userInvestment.save();
    }
    res.status(200).json({ success: true, message: 'Stocks purchased successfully!' });
  } catch (error) {
    console.error('Error buying stocks:', error);
    res.status(500).json({ success: false, message: 'Failed to buy stocks. Please try again later.' });
  }
});

// Endpoint to update wallet balance after buying stock
app.post('/update-wallet', async (req, res) => {
  const { email, totalCost } = req.body;
  try {
    // Fetch the user wallet from the database
    const userWallet = await UserWallet.findOne({ email });
    if (!userWallet) {
      throw new Error('User wallet not found');
    }
    userWallet.wallet -= totalCost;
    await userWallet.save();
    res.status(200).json({ message: 'Wallet balance updated successfully' });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for selling stocks
app.post('/sell', async (req, res) => {
  const { userEmail, stockName, sellAmount } = req.body;
  try {
    // Retrieve user investments
    const userInvestments = await UserInvestment.find({ user_email: userEmail, stock_name: stockName });
    let totalStocksOwned = 0;
    userInvestments.forEach((investment) => {
      totalStocksOwned += investment.stock_amount;
    });
    if (totalStocksOwned < sellAmount) {
      return res.status(400).json({ error: 'Not enough stocks to sell' });
    }
    // Fetch latest price of stock
    const latestPriceResponse = await fetch(`/latest-price/${stockName}`);
    const latestPriceData = await latestPriceResponse.json();
    const latestPrice = latestPriceData.price;
    const totalAmount = latestPrice * sellAmount;
    // Update user wallet balance
    const userWallet = await UserWallet.findOne({ email: userEmail });
    userWallet.balance += totalAmount;
    await userWallet.save();
    // Update user investments
    for (const investment of userInvestments) {
      if (sellAmount >= investment.stock_amount) {
        // Delete record if sell amount matches stock owned
        await UserInvestment.findByIdAndDelete(investment._id);
        sellAmount -= investment.stock_amount;
      } else {
        // Reduce stock amount
        investment.stock_amount -= sellAmount;
        await investment.save();
        break; // Exit loop if sell amount is up
      }
    }
    res.redirect('/portfolio.html');
  } catch (error) {
    console.error('Error selling stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to reduce stock amount
app.post('/reduce-stock', async (req, res) => {
  const { stockName, dateBought, amount } = req.body;
  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    // Fetch user investment for specified stock at date bought
    const investment = await UserInvestment.findOne({ stock_name: stockName, date_bought: dateBought });
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    // Decrease stock amount
    investment.stock_amount -= parsedAmount;
    // remove entry if stock amount < 0
    if (investment.stock_amount <= 0) {
      await UserInvestment.findByIdAndDelete(investment._id);
    } else {
      // Save updated investment
      await investment.save();
    }
    res.status(200).json({ message: 'Stock amount reduced successfully' });
  } catch (error) {
    console.error('Error reducing stock amount:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to increase wallet amount
app.post('/increase-wallet', async (req, res) => {
  const { amount, userEmail } = req.body;
  try {
    const totalPrice = parseFloat(amount);
    // Find user wallet
    const userWallet = await UserWallet.findOne({ email: userEmail });
    if (!userWallet) {
      return res.status(404).json({ error: 'User wallet not found' });
    }
    // Update wallet balance
    userWallet.wallet += totalPrice;
    await userWallet.save();
    res.status(200).json({ message: 'Wallet amount increased successfully' });
  } catch (error) {
    console.error('Error increasing wallet amount:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Website redirect: http://localhost:${port}/public/landing.html`);
});
