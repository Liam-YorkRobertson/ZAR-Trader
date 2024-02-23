const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
const { getHistoricalPrices, getSymbolInfo } = require('./yahooAPI');

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
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    // Send success response
    res.status(200).json({ message: 'Sign-in successful' });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch historical prices
app.get('/historical-prices/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const historicalPrices = await getHistoricalPrices(symbol);
    res.json(historicalPrices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch stock symbol information
app.get('/symbol/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const symbolInfo = await getSymbolInfo(symbol);
    res.json(symbolInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Website redirect: http://localhost:3000/public/landing.html');
});
