const axios = require('axios');

async function testNearbyProviders() {
    try {
        const response = await axios.get('http://localhost:5000/api/providers/nearby', {
            params: {
                latitude: -1.3095883,
                longitude: 36.8337083,
                radius: 5000,
                serviceType: 'moving'
            }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testNearbyProviders();
