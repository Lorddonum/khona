const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// POST /api/checkout/create-session
router.post('/create-session', async (req, res) => {
  try {
    const { items, customer } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'mad',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
      customer_email: customer?.email,
      metadata: { customerName: customer?.name || '' },
    });

    // Pre-create order in pending state
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = new Order({
      customer,
      items,
      totalAmount,
      stripeSessionId: session.id,
    });
    await order.save();

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/checkout/webhook (Stripe webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await Order.findOneAndUpdate(
      { stripeSessionId: session.id },
      { paymentStatus: 'paid', status: 'processing' }
    );
  }

  res.json({ received: true });
});

// GET /api/checkout/success/:sessionId
router.get('/success/:sessionId', async (req, res) => {
  try {
    const order = await Order.findOne({ stripeSessionId: req.params.sessionId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
