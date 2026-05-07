const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/products  (with optional filters: category, featured, search, page, limit, isNew, isHotSelling, promotion)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 12, isNew, isHotSelling, promotion } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (isNew === 'true') filter.isNewProduct = true;
    if (isHotSelling === 'true') filter.isHotSelling = true;
    if (promotion === 'true') filter['promotion.active'] = true;
    if (search) {
      filter.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.fr': { $regex: search, $options: 'i' } },
        { 'name.ar': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products (admin)
router.post('/', protect, adminOnly, upload.array('images', 10), async (req, res) => {
  try {
    const { price, quantity, category, slug, featured, isNewProduct, isHotSelling } = req.body;
    const name = JSON.parse(req.body.name);
    const description = req.body.description ? JSON.parse(req.body.description) : {};
    const specifications = req.body.specifications ? JSON.parse(req.body.specifications) : [];
    const models = req.body.models ? JSON.parse(req.body.models) : [];
    const promotion = req.body.promotion ? JSON.parse(req.body.promotion) : { active: false, discountPercent: 0 };
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const product = new Product({
      name,
      description,
      specifications,
      models,
      price: Number(price),
      quantity: Number(quantity),
      category,
      slug,
      featured: featured === 'true',
      isNewProduct: isNewProduct === 'true',
      isHotSelling: isHotSelling === 'true',
      promotion,
      images,
    });
    const saved = await product.save();
    const populated = await saved.populate('category', 'name slug');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id (admin)
router.put('/:id', protect, adminOnly, upload.array('images', 10), async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = JSON.parse(req.body.name);
    if (req.body.description) updates.description = JSON.parse(req.body.description);
    if (req.body.specifications) updates.specifications = JSON.parse(req.body.specifications);
    if (req.body.models) updates.models = JSON.parse(req.body.models);
    if (req.body.price) updates.price = Number(req.body.price);
    if (req.body.quantity !== undefined) updates.quantity = Number(req.body.quantity);
    if (req.body.category) updates.category = req.body.category;
    if (req.body.slug) updates.slug = req.body.slug;
    if (req.body.featured !== undefined) updates.featured = req.body.featured === 'true';
    if (req.body.isNewProduct !== undefined) updates.isNewProduct = req.body.isNewProduct === 'true';
    if (req.body.isHotSelling !== undefined) updates.isHotSelling = req.body.isHotSelling === 'true';
    if (req.body.promotion) updates.promotion = JSON.parse(req.body.promotion);
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
