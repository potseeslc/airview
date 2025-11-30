const axios = require('axios');

async function testFlightradar24() {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.flightradar24.com/',
        'Origin': 'https://www.flightradar24.com'
    };
    
    try {
        // Test various endpoints
        console.log('Testing Flightradar24 API...');
        
        // Test 1: Standard endpoint
        const response1 = await axios.get('https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=37.7,38.5,-122.5,-121.5', { headers });
        console.log('✅ Standard endpoint works:', !!response1.data);
        
        // Test 2: Alternative endpoint
        const response2 = await axios.get('https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=37.7,38.5,-122.5,-121.5', { headers });
        console.log('✅ Alternative endpoint works:', !!response2.data);
        
        // Test 3: Public data endpoint
        const response3 = await axios.get('https://api.flightradar24.com/common/v1/flight/list.json', { headers });
        console.log('✅ Public API works:', !!response3.data);
        
    } catch (error) {
        console.log('❌ API failed:', error.message);
        console.log('Status:', error.response?.status);
        console.log('Headers:', error.response?.headers);
    }
}

testFlightradar24();
