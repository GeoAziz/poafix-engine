const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/providers/nearby?latitude=-1.3095883&longitude=36.8337083&radius=5000&serviceType=moving',
    method: 'GET'
};

const req = http.request(options, res => {
    console.log(`Status Code: ${res.statusCode}`);
    
    let data = '';
    
    res.on('data', chunk => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response Body:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
});

req.on('error', error => {
    console.error('Error:', error);
});

req.end();
