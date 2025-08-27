import { MpesaService } from '../services/mpesaService.js';
import { Booking } from '../models/booking.model.js';

export const initiateMpesaPayment = async (req, res) => {
  try {
    const { phoneNumber, amount, bookingId } = req.body;
    
    // Initiate STK Push
    const stkResult = await MpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      bookingId
    });

    // Update booking with checkout request ID
    await Booking.findByIdAndUpdate(bookingId, {
      'payment.checkoutRequestId': stkResult.CheckoutRequestID
    });

    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        checkoutRequestId: stkResult.CheckoutRequestID
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const handleMpesaCallback = async (req, res) => {
  try {
    const { Body: { stkCallback } } = req.body;
    
    const booking = await Booking.findOne({
      'payment.checkoutRequestId': stkCallback.CheckoutRequestID
    });

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      await booking.updatePaymentStatus('completed', {
        amount: stkCallback.Amount,
        transactionId: stkCallback.MpesaReceiptNumber
      });
    } else {
      // Payment failed
      await booking.updatePaymentStatus('failed');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mpesa callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
