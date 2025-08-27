export const config = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  oauth_url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate',
  stkpush_url: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  callback_url: process.env.BASE_URL
};
