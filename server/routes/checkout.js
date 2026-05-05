const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// ─── CMI Helpers ─────────────────────────────────────────────────────────────

/**
 * CMI requires all params sorted alphabetically, concatenated as
 * "key1:value1|key2:value2|..." then HMAC-SHA512 with the store key.
 */
function computeCmiHash(params, storeKey) {
  const sorted = Object.keys(params)
    .sort()
    .filter((k) => k !== 'HASH' && params[k] !== '')
    .map((k) => `${params[k]}`)
    .join('|');

  // CMI uses an escape-then-hash mechanism (storeKey wraps the data)
  const hashInput = storeKey + sorted;
  return crypto.createHmac('sha512', storeKey).update(hashInput).digest('hex').toUpperCase();
}

// ─── POST /api/checkout/initiate ─────────────────────────────────────────────
// Frontend calls this, gets back an HTML form that auto-submits to CMI
router.post('/initiate', async (req, res) => {
  try {
    const { items, customer } = req.body;

    const totalAmount = items
      .reduce((sum, i) => sum + i.price * i.quantity, 0)
      .toFixed(2);

    // Create a pending order first
    const order = new Order({
      customer,
      items,
      totalAmount,
      paymentStatus: 'pending',
      status: 'pending',
    });
    await order.save();

    const orderId = order._id.toString();
    const clientId  = process.env.CMI_CLIENT_ID;
    const storeKey  = process.env.CMI_STORE_KEY;
    const cmiUrl    = process.env.CMI_PAYMENT_URL || 'https://payment.cmi.co.ma/fim/est3Dgate';
    const baseUrl   = process.env.CLIENT_URL;

    // All params CMI requires
    const params = {
      clientid:      clientId,
      amount:        totalAmount,
      currency:      '504',           // MAD = ISO 4217 code 504
      oid:           orderId,
      okUrl:         `${baseUrl}/checkout/success`,
      failUrl:       `${baseUrl}/checkout/fail`,
      callbackUrl:   `${baseUrl.replace('http://','https://')}/api/checkout/callback`,
      trantype:      'PreAuth',
      instalment:    '',
      rnd:           Date.now().toString(),
      lang:          'fr',
      encoding:      'UTF-8',
      email:         customer?.email || '',
      BillToName:    customer?.name  || '',
    };

    params.HASH = computeCmiHash(params, storeKey);

    // Build an auto-submitting HTML form (CMI only accepts POST)
    const fields = Object.entries(params)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}" />`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Redirection vers CMI...</title></head>
<body onload="document.forms[0].submit()">
  <p>Redirection vers le paiement sécurisé CMI...</p>
  <form action="${cmiUrl}" method="POST">
    ${fields}
  </form>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error('CMI initiate error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/checkout/callback (server-to-server from CMI) ─────────────────
router.post('/callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const params    = { ...req.body };
    const storeKey  = process.env.CMI_STORE_KEY;
    const receivedHash = params.HASH;

    const expectedHash = computeCmiHash(params, storeKey);

    if (receivedHash !== expectedHash) {
      console.error('CMI callback: HASH mismatch');
      return res.send('FAILURE'); // CMI expects plain text response
    }

    const { oid, Response } = params;

    if (Response === 'Approved') {
      await Order.findByIdAndUpdate(oid, {
        paymentStatus: 'paid',
        status: 'processing',
        cmiResponse: params,
      });
      return res.send('ACTION=POSTAUTH');  // Required ACK to CMI
    } else {
      await Order.findByIdAndUpdate(oid, {
        paymentStatus: 'failed',
        status: 'cancelled',
        cmiResponse: params,
      });
      return res.send('FAILURE');
    }
  } catch (err) {
    console.error('CMI callback error:', err);
    res.status(500).send('ERROR');
  }
});

// ─── GET /api/checkout/success/:orderId ──────────────────────────────────────
router.get('/success/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
