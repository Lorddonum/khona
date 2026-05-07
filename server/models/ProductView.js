const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  country: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProductView', productViewSchema);
