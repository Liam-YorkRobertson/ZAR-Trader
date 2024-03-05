// Defines schema and model for user_investments

const mongoose = require('mongoose');

const userInvestmentSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true,
  },
  stock_name: {
    type: String,
    required: true,
  },
  date_bought: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock_amount: {
    type: Number,
    required: true,
  },
}, { collection: 'user_investments' });

const UserInvestment = mongoose.model('UserInvestment', userInvestmentSchema);

module.exports = UserInvestment;
