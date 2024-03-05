// Defines schema and model for user_wallet

const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  wallet: {
    type: Number,
    required: true,
    default: 0,
  },
}, { collection: 'user_wallet' });

module.exports = mongoose.model('userWallet', userWalletSchema);
