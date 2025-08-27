const axios = require('axios');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
import { Booking } from '../models/booking.model.js';

class MpesaHandler {
    constructor(websocketManager) {
        this.wsManager = websocketManager;
        this.baseUrl = process.env.MPESA_API_URL;
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    }

    async generateToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        
        try {
            const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            });
            
            return response.data.access_token;
        } catch (error) {
            console.error('Error generating MPESA token:', error);
            throw error;
        }
    }

    async initiatePayment(phoneNumber, amount, bookingId) {
        try {
            const token = await this.generateToken();
            
            const response = await axios.post(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: this.generatePassword(),
                Timestamp: this.generateTimestamp(),
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phoneNumber,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: phoneNumber,
                CallBackURL: `${process.env.API_BASE_URL}/api/payments/mpesa/callback`,
                AccountReference: bookingId,
                TransactionDesc: "Service Payment"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await Payment.create({
                bookingId,
                amount,
                phoneNumber,
                status: 'pending',
                checkoutRequestId: response.data.CheckoutRequestID
            });

            return response.data;

        } catch (error) {
            console.error('Error initiating MPESA payment:', error);
            throw error;
        }
    }

    async handleCallback(callbackData) {
        const { ResultCode, CheckoutRequestID } = callbackData.Body.stkCallback;
        
        try {
            const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });
            if (!payment) throw new Error('Payment not found');

            payment.status = ResultCode === 0 ? 'completed' : 'failed';
            payment.resultCode = ResultCode;
            payment.resultDesc = callbackData.Body.stkCallback.ResultDesc;
            await payment.save();

            if (ResultCode === 0) {
                const booking = await Booking.findById(payment.bookingId);
                booking.status = 'paid';
                booking.paymentId = payment._id;
                await booking.save();

                this.wsManager.emitBookingUpdate(payment.bookingId, booking);
            }

            return { success: true };

        } catch (error) {
            console.error('Error handling MPESA callback:', error);
            throw error;
        }
    }

    generatePassword() {
        // Implement MPESA password generation logic
        return Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${this.generateTimestamp()}`).toString('base64');
    }

    generateTimestamp() {
        return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    }
}

module.exports = MpesaHandler;
