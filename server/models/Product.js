const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    ar: { type: String, required: true },
  },
  description: {
    en: String,
    fr: String,
    ar: String,
  },
  specifications: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
  }],
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ type: String }],
  featured: { type: Boolean, default: false },
  isNewProduct: { type: Boolean, default: false },
  isHotSelling: { type: Boolean, default: false },
  promotion: {
    active: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
  },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Product', productSchema);
