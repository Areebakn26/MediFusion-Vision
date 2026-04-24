const axios = require('axios');

async function testBrainAI() {
    const scanId = '6a687a76-3f35-4bb7-95d9-a59732ff439b';
    try {
        console.log(`Triggering Brain AI Analysis for Scan: ${scanId}`);
        const response = await axios.post(`http://localhost:5000/api/scans/${scanId}/analyze-brain`, {}, {
            headers: {
                // We need a token. I'll login first.
            }
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    }
}

// Since I don't want to deal with tokens in a scratch script easily,
// I'll just check the scanController.js code again for obvious flaws.
