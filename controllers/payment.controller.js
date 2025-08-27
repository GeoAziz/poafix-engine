import Payment from '../models/Payment.js';
import { initiateMpesaPayment } from '../services/mpesa.service.js';
import { initiatePaypalPayment } from '../services/paypal.service.js';

export const initiateMpesa = async (req, res) => {
  try {
    const { bookingId, clientId, providerId, amount, phoneNumber } = req.body;
    const payment = await Payment.create({
      bookingId,
      clientId,
      providerId,
      amount,
      method: 'mpesa',
      status: 'pending'
    });
    const mpesaResult = await initiateMpesaPayment({ phoneNumber, amount, bookingId, clientId, providerId });
    if (mpesaResult.success) {
      payment.status = 'completed';
      payment.transactionRef = mpesaResult.transactionRef;
      await payment.save();
    }
    res.json({ success: true, payment, mpesaResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const initiatePaypal = async (req, res) => {
  try {
    const { bookingId, clientId, providerId, amount } = req.body;
    const payment = await Payment.create({
      bookingId,
      clientId,
      providerId,
      amount,
      method: 'paypal',
      status: 'pending'
    });
    const paypalResult = await initiatePaypalPayment({ amount, bookingId, clientId, providerId });
    res.json({ success: true, payment, paypalResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
