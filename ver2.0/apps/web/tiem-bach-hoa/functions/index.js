const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Simple HTTP endpoints for payment webhooks (MoMo / VNPAY / generic)
// This endpoint accepts JSON POSTs from payment providers or your merchant backend.
// It attempts to verify an HMAC signature when provided and updates the matching
// Firestore order document (by doc id = merchantOrderId or by matching transferNote).
const functions = require('firebase-functions');
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '1mb' }));

// Helper: verify HMAC-SHA256 signature with secret
function verifyHmac(payloadString, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const h = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
    return h === signature;
  } catch (e) {
    console.error('hmac verify error', e);
    return false;
  }
}

app.post('/payment-webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const provider = (body.provider || body.gateway || '').toString().toLowerCase();
    const merchantOrderId = body.merchantOrderId || body.orderId || body.order_id || body.merchant_orderid || '';
    const transactionId = body.transactionId || body.transId || body.transaction_id || body.transaction || '';
    const amount = body.amount || body.total || 0;
    const status = (body.status || body.result || body.resultCode || '').toString();
    const signature = body.signature || body.sign || body.hash || '';

    // Basic payload string for signature validation (provider-specific integrations
    // can customize to compute exactly what the provider signs). We use a simple
    // concatenation of merchantOrderId + transactionId + amount when verifying.
    const payloadString = `${merchantOrderId}|${transactionId}|${amount}`;

    // Read secret from functions config: e.g. `firebase functions:config:set payment.momo_secret="..."`
    const cfg = functions.config() || {};
    const secret = (cfg.payment && cfg.payment[`${provider}_secret`]) || (process.env[`${provider.toUpperCase()}_SECRET`]) || null;

    if (signature && secret) {
      const ok = verifyHmac(payloadString, signature, secret);
      if (!ok) {
        console.warn('Invalid signature for payment webhook', { provider, merchantOrderId });
        return res.status(403).send('invalid signature');
      }
    }

    // Try to find the order by doc id first (merchantOrderId)
    let orderRef = null;
    let orderSnap = null;
    if (merchantOrderId) {
      orderRef = db.collection('orders').doc(merchantOrderId);
      orderSnap = await orderRef.get();
    }

    // If not found by id, try to find by transferNote (matching merchantOrderId)
    if ((!orderSnap || !orderSnap.exists) && merchantOrderId) {
      const q = await db.collection('orders').where('transferNote', '==', merchantOrderId).limit(1).get();
      if (!q.empty) {
        orderSnap = q.docs[0];
        orderRef = q.docs[0].ref;
      }
    }

    if (!orderRef) {
      console.warn('Order not found for webhook', { provider, merchantOrderId });
      return res.status(404).send('order not found');
    }

    // Update order: mark reconciled/paid and unlock
    const updatePayload = {
      'payment.reconciled': true,
      'payment.reconciliation': {
        provider: provider || null,
        transactionId: transactionId || null,
        amount: Number(amount) || null,
        raw: body,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      locked: false,
      status: 'Đã thanh toán'
    };

    await orderRef.update(updatePayload);

    console.log('Order reconciled', { orderId: orderRef.id, provider, transactionId });
    return res.status(200).send('ok');
  } catch (err) {
    console.error('payment-webhook error', err);
    return res.status(500).send('error');
  }
});

exports.api = functions.https.onRequest(app);

// Cloud Function: validate tracking events on create
exports.onTrackingEventCreate = (snap, context) => {
  const data = snap.data();
  const path = snap.ref.path; // orders/{orderId}/trackingEvents/{eventId}
  console.log('Tracking event created at', path);

  const updates = {};
  try {
    // Ensure ts exists (use server timestamp)
    if (!data.ts) {
      updates.ts = admin.firestore.FieldValue.serverTimestamp();
    }

    // Normalize location if present
    if (data.location) {
      const lat = Number(data.location.lat);
      const lng = Number(data.location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        updates['location.lat'] = lat;
        updates['location.lng'] = lng;
      } else {
        // mark invalid location
        updates.invalidLocation = true;
      }
    }

    // Protect against large accuracy values
    if (data.accuracy && typeof data.accuracy === 'number' && data.accuracy > 10000) {
      updates.accuracyFlag = 'low-precision';
    }

    // If there's a status "Đã Giao Hàng" we could notify user (left as TODO)

    if (Object.keys(updates).length > 0) {
      return snap.ref.update(updates);
    }
  } catch (e) {
    console.error('Error validating tracking event', e);
  }
  return null;
};
