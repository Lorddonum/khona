const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
  slug: { type: String, required: true, unique: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Category', categorySchema);
