const express = require('express');
const router = express.Router();
const ProductView = require('../models/ProductView');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/analytics/view/:productId
router.post('/view/:productId', async (req, res) => {
  try {
    const { country, city } = req.body;
    
    // Create a new view record
    const view = new ProductView({
      product: req.params.productId,
      country: country || 'Unknown',
      city: city || 'Unknown',
    });
    
    await view.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Analytics view error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/top-products
// Gets the most viewed products and their view count breakdown by location
router.get('/top-products', protect, adminOnly, async (req, res) => {
  try {
    // Aggregate views
    const topProducts = await ProductView.aggregate([
      {
        $group: {
          _id: { product: '$product', country: '$country', city: '$city' },
          views: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.product',
          totalViews: { $sum: '$views' },
          locations: {
            $push: {
              country: '$_id.country',
              city: '$_id.city',
              views: '$views'
            }
          }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 1,
          totalViews: 1,
          locations: 1,
          'productDetails.name': 1,
          'productDetails.images': 1,
          'productDetails.price': 1
        }
      }
    ]);
    
    res.json(topProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
