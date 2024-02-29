const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
const { getHistoricalPrices } = require('./yahooAPI');
const UserWallet = require('./models/userWallet');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/zar-trader', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// middleware
app.use(bodyParser.json());

// serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// sign up
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // create new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    // Check if wallet entry already exists for the user's email
    const existingWallet = await UserWallet.findOne({ email });
    if (!existingWallet) {
      // If no wallet entry exists, create a new one
      const userWallet = new UserWallet({ email, wallet: 0 }); // Initialize wallet amount as 0
      await userWallet.save();
    }

    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// sign in
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
    // Validate password
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    // Send success response with user's email
    res.status(200).json({ message: 'Sign-in successful', email: user.email });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for fetching historical prices
app.get('/historical-prices/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    // Fetch historical prices for the requested symbol
    const historicalPrices = await getHistoricalPrices(symbol);
    res.json(historicalPrices);
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Wallet
// Endpoint to deposit into wallet
app.get('/deposit', async (req, res) => {
  const { email, amount } = req.query;
  try {
    // Find the user's wallet entry
    const userWallet = await UserWallet.findOne({ email });
    if (!userWallet) {
      return res.status(404).json({ error: 'User not found or wallet does not exist' });
    }
    // Update user's wallet in the database
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
    // Find the user's wallet entry
    const userWallet = await UserWallet.findOne({ email });
    if (!userWallet) {
      return res.status(404).json({ error: 'User not found or wallet does not exist' });
    }
    // Check if sufficient balance
    if (userWallet.wallet < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    // Update user's wallet in the database
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
  const { email } = req.query; // Use req.query to access query parameters
  try {
    // Retrieve user's wallet from the database
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Website redirect: http://localhost:3000/public/landing.html');
});
