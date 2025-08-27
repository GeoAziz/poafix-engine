import axios from 'axios';
import { config } from '../config/mpesa.js';

export class MpesaService {
  static async getAccessToken() {
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    
    const response = await axios.get(config.oauth_url, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    return response.data.access_token;
  }

  static async initiateSTKPush({ phoneNumber, amount, bookingId }) {
    const token = await this.getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');

    const response = await axios.post(
      config.stkpush_url,
      {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: config.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: `${config.callback_url}/api/payments/mpesa/callback`,
        AccountReference: bookingId,
        TransactionDesc: 'Service Payment'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  }
}
