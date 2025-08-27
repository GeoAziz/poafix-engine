import paypal from '@paypal/checkout-server-sdk';

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_SANDBOX_CLIENT_ID,
      process.env.PAYPAL_SANDBOX_CLIENT_SECRET
    );

export const client = new paypal.core.PayPalHttpClient(environment);

export const config = {
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  merchantId: process.env.NODE_ENV === 'production' 
    ? 'YOUR_LIVE_MERCHANT_ID'  // Replace with your live merchant ID
    : 'sb-cknjq42278182@business.example.com', // Your sandbox business account
  currency: 'KES',
  returnUrl: `${process.env.BASE_URL}/api/paypal/success`,
  cancelUrl: `${process.env.BASE_URL}/api/paypal/cancel`
};
