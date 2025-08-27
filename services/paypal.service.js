import axios from 'axios';
import paypalConfig from '../config/paypal.config.js';

// PayPal payment service stub
// Integrate with PayPal REST API for real payments

export async function initiatePaypalPayment({ amount, bookingId, clientId, providerId }) {
  // Load sandbox credentials from environment
  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  // Get access token from PayPal sandbox
  const tokenRes = await axios.post(
    'https://api.sandbox.paypal.com/v1/oauth2/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  const accessToken = tokenRes.data.access_token;

  // Create PayPal order with custom deep link URLs for mobile app
  const orderRes = await axios.post(
    'https://api.sandbox.paypal.com/v2/checkout/orders',
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD', // Change to your currency if needed
            value: amount.toString()
          }
        }
      ],
      application_context: {
        brand_name: paypalConfig.brandName,
        user_action: 'PAY_NOW',
        return_url: paypalConfig.returnUrl,
        cancel_url: paypalConfig.cancelUrl
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Find the approval URL in the response
  const approvalUrl = orderRes.data.links.find(link => link.rel === 'approve')?.href;

  return {
    success: true,
    transactionRef: orderRes.data.id,
    approvalUrl,
    message: 'Redirect client to PayPal for payment.'
  };
}
