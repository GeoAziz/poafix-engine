import express from 'express';
import Payment from '../models/Payment.js';
import { Booking } from '../models/booking.model.js';
import { Notification } from '../models/notification.js';
import { WebSocketService } from '../services/websocket.service.js';
import { payWithPaypal } from '../controllers/booking.controller.js';
import { initiateMpesa } from '../controllers/payment.controller.js';
import { initiateMpesaPayment } from '../services/mpesa.service.js';
import { createPayment, executePayment, checkPaymentStatus, listPendingPayments } from '../controllers/paypal.controller.js';

const router = express.Router();

export default function(eventManager) {
    // PayPal payment initiation route wired to booking controller
    router.post('/paypal/initiate', async (req, res) => {
        try {
            console.log('[Route] /paypal/initiate called with:', req.body);
            await payWithPaypal(req, res);
        } catch (err) {
            console.error('[Route] /paypal/initiate error:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });
    // MPESA payment temporarily disabled
    // router.post('/mpesa/initiate', initiateMpesa);

    // PayPal payment endpoints
    router.post('/paypal/create', createPayment);
    router.post('/paypal/execute', executePayment);
    router.get('/paypal/status/:bookingId', checkPaymentStatus);
    // Endpoint for Flutter to get pending payments for a client
    router.get('/paypal/pending/:clientId', listPendingPayments);

    // Check payment status (stub, replace with real logic)
    router.get('/status/:bookingId', async (req, res) => {
        try {
            const { bookingId } = req.params;
            // TODO: Replace with real payment status check
            // For now, just return a stub response
            res.json({ status: 'pending', bookingId });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to check payment status',
                details: error.message
            });
        }
    });

    // Mpesa callback URL
    router.post('/mpesa/callback', async (req, res) => {
        try {
            const { Body } = req.body;
            
            if (Body.stkCallback.ResultCode === 0) {
                eventManager.emit('payment:completed', {
                    bookingId: Body.stkCallback.MerchantRequestID,
                    transactionId: Body.stkCallback.CheckoutRequestID,
                    amount: Body.stkCallback.CallbackMetadata.Item[0].Value
                });
            } else {
                eventManager.emit('payment:failed', {
                    bookingId: Body.stkCallback.MerchantRequestID,
                    reason: Body.stkCallback.ResultDesc
                });
            }

            res.json({ ResultCode: 0, ResultDesc: "Success" });
        } catch (error) {
            console.error('Mpesa callback error:', error);
            res.status(500).json({
                error: 'Failed to process callback',
                details: error.message
            });
        }
    });

    // Complete PayPal payment and update booking status
    router.post('/paypal/complete', async (req, res) => {
        try {
            const { token, PayerID, bookingId, paymentId } = req.body;
            
            // Update payment status
            const payment = await Payment.findById(paymentId);
            payment.status = 'completed';
            payment.paypalToken = token;
            payment.paypalPayerId = PayerID;
            await payment.save();

            // Update booking status
            const booking = await Booking.findById(bookingId);
            booking.status = 'completed';
            await booking.save();

            // Create success notification
            const notification = await Notification.create({
                recipient: booking.clientId,
                recipientModel: 'Client',
                type: 'system',
                title: 'Payment Successful',
                message: 'Your PayPal payment was completed successfully.',
                data: {
                    bookingId,
                    paymentId,
                    amount: payment.amount
                }
            });

            // Emit WebSocket notification
            WebSocketService.notifyUser(booking.clientId, {
                type: 'PAYMENT_COMPLETED',
                notification
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Error completing PayPal payment:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    });

    return router;
}
