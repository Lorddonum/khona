const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  selectedModel: String,
  price: Number,
  quantity: Number,
  image: String,
});

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    city: String,
    country: String,
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  isTestOrder: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  stripeSessionId: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Order', orderSchema);
