import dotenv from 'dotenv';
import https from 'https';
import Payment from '../models/Payment.js';
import { Booking } from '../models/booking.model.js';

dotenv.config();

const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// Helper function to get PayPal access token
const getPayPalAccessToken = () => {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');

    const options = {
      hostname: PAYPAL_API.replace('https://', ''),
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.access_token);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write('grant_type=client_credentials');
    req.end();
  });
};

export const createPayment = async (req, res) => {
  try {
    const { amount, bookingId, clientId, providerId } = req.body;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order using the native HTTPS module
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toString()
        },
        reference_id: bookingId
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      }
    };

    const orderResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: PAYPAL_API.replace('https://', ''),
        path: '/v2/checkout/orders',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(orderData));
      req.end();
    });

    console.log('PayPal Order:', JSON.stringify(orderResponse, null, 2));

    // Find approval link robustly
    const approvalLink = Array.isArray(orderResponse.links)
      ? orderResponse.links.find(link => link.rel === 'approve')
      : null;

    if (!approvalLink) {
      console.error('No approval link found in PayPal response:', orderResponse);
      return res.status(500).json({
        success: false,
        error: 'No approval link found in PayPal response',
        response: orderResponse
      });
    }

    // Save payment details
    const payment = await Payment.create({
      bookingId,
      clientId,
      providerId,
      amount,
      method: 'paypal',
      status: 'pending',
      paypalOrderId: orderResponse.id,
      paypalPaymentUrl: approvalLink.href,
      currency: 'USD'
    });

    res.json({
      success: true,
      paymentUrl: payment.paypalPaymentUrl,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('PayPal payment creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create PayPal payment'
    });
  }
};

export const executePayment = async (req, res) => {
  try {
    const { paymentId, payerId } = req.body;

    // Find the payment
    const payment = await Payment.findOne({ paypalOrderId: paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order using the native HTTPS module
    const captureResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: PAYPAL_API.replace('https://', ''),
        path: `/v2/checkout/orders/${paymentId}/capture`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log('PayPal Capture:', JSON.stringify(captureResponse, null, 2));

    // Update payment status
    payment.status = 'completed';
    payment.paypalPayerId = payerId;
    payment.paypalTransactionId = captureResponse.purchase_units[0].payments.captures[0].id;
    payment.transactionRef = payment.paypalTransactionId;
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      'payment.status': 'completed',
      'payment.transactionId': payment.paypalTransactionId
    });

    res.json({
      success: true,
      message: 'Payment completed successfully'
    });
  } catch (error) {
    console.error('PayPal payment execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute PayPal payment'
    });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({ bookingId, method: 'paypal' })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // If payment is pending and has PayPal order ID, check status with PayPal
    if (payment.status === 'pending' && payment.paypalOrderId) {
      // Get PayPal access token
      const accessToken = await getPayPalAccessToken();

      // Check order status using the native HTTPS module
      const orderStatus = await new Promise((resolve, reject) => {
        const options = {
          hostname: PAYPAL_API.replace('https://', ''),
          path: `/v2/checkout/orders/${payment.paypalOrderId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          });
        });

        req.on('error', reject);
        req.end();
      });

      console.log('PayPal Order Status:', JSON.stringify(orderStatus, null, 2));

      // Update payment status if completed
      if (orderStatus.status === 'COMPLETED') {
        payment.status = 'completed';
        payment.paypalTransactionId = orderStatus.purchase_units[0].payments.captures[0].id;
        payment.transactionRef = payment.paypalTransactionId;
        await payment.save();

        // Update booking status
        await Booking.findByIdAndUpdate(payment.bookingId, {
          'payment.status': 'completed',
          'payment.transactionId': payment.paypalTransactionId
        });
      }

      res.json({
        success: true,
        status: payment.status,
        paypalStatus: orderStatus.status,
        transactionId: payment.paypalTransactionId
      });
    } else {
      // Return stored payment status
      res.json({
        success: true,
        status: payment.status,
        transactionId: payment.paypalTransactionId
      });
    }
  } catch (error) {
    console.error('PayPal payment status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check payment status'
    });
  }
};

export const listPendingPayments = async (req, res) => {
  try {
    const clientId = req.userId || req.params.clientId;
    if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
    const payments = await Payment.find({ clientId, status: 'pending' });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
