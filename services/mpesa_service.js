import axios from 'axios';

export class MpesaAPI {
    constructor() {
        this.baseUrl = process.env.MPESA_API_URL;
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.passkey = process.env.MPESA_PASSKEY;
        this.shortcode = process.env.MPESA_SHORTCODE;
        this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    }

    async getAccessToken() {
        const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
        
        try {
            const response = await axios.get(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });
            
            return response.data.access_token;
        } catch (error) {
            throw new Error(`Failed to get access token: ${error.message}`);
        }
    }

    async initiatePayment({ phoneNumber, amount, accountReference, transactionDesc }) {
        try {
            const token = await this.getAccessToken();
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
            const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                {
                    BusinessShortCode: this.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phoneNumber,
                    PartyB: this.shortcode,
                    PhoneNumber: phoneNumber,
                    CallBackURL: this.callbackUrl,
                    AccountReference: accountReference,
                    TransactionDesc: transactionDesc
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(`Failed to initiate payment: ${error.message}`);
        }
    }

    async checkPaymentStatus(checkoutRequestId) {
        try {
            const token = await this.getAccessToken();
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
            const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                {
                    BusinessShortCode: this.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    CheckoutRequestID: checkoutRequestId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(`Failed to check payment status: ${error.message}`);
        }
    }
}
