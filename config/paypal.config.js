// Use localhost for emulator, 10.0.2.2 for Android emulator access to host
const LOCAL_URL = 'http://10.0.2.2:5000'; // For Android emulator
// const LOCAL_URL = 'http://localhost:5000'; // For iOS simulator or web

const config = {
  returnUrl: `${LOCAL_URL}/paypal/success`,
  cancelUrl: `${LOCAL_URL}/paypal/cancel`,
  brandName: 'Poafix'
};

export default config;
