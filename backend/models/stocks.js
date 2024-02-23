const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stockName: {
    type: String,
    required: true,
  },
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
