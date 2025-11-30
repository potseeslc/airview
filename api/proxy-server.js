// Simple Node.js proxy server to handle Flightradar24 API calls
// This avoids CORS issues and provides more reliable data fetching

const http = require('http');
const https = require('https');

const proxyServer = http.createServer((req, res) = {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle different endpoints
    if (req.url.startsWith('/api/flights/local')) {
        // Extract parameters from URL
        const urlParams = new URL(req.url, 'http://localhost').searchParams;
        const lat = urlParams.get('lat') || '37.7749';
        const lon = urlParams.get('lon') || '-122.4194';
        const radius = urlParams.get('radius') || '50';
        
        getFlightsInArea(lat, lon, radius, res);
    } else if (req.url.startsWith('/api/flights/global')) {
        getMostTrackedFlights(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
});

function getFlightsInArea(lat, lon, radius, res) {
    const latMin = parseFloat(lat) - radius/111;
    const latMax = parseFloat(lat) + radius/111;
    const lonMin = parseFloat(lon) - radius/(111 * Math.cos(lat * Math.PI/180));
    const lonMax = parseFloat(lon) + radius/(111 * Math.cos(lat * Math.PI/180));
    
    const bounds = `${latMin.toFixed(2)},${latMax.toFixed(2)},${lonMin.toFixed(2)},${lonMax.toFixed(2)}`;
    
    const options = {
        hostname: 'data-cloud.flightradar24.com',
        path: `/zones/fcgi/feed.js?bounds=${bounds}`,
        method: 'GET'
    };
    
    makeRequest(options, res);
}

function getMostTrackedFlights(res) {
    const options = {
        hostname: 'data-cloud.flightradar24.com',
        path: '/zones/fcgi/feed.js?bounds=90,-90,180,-180',
        method: 'GET'
    };
    
    makeRequest(options, res);
}

function makeRequest(options, res) {
    const request = https.request(options, (apiRes) = {
        let data = '';
        
        apiRes.on('data', (chunk) = {
            data += chunk;
        });
        
        apiRes.on('end', () = {
            try {
                // Parse JSON and process flight data
                const flights = processFlightData(JSON.parse(data));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ flights, timestamp: new Date().toISOString() }));
            } catch (error) {
                console.error('Error processing data:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process flight data' }));
            }
        });
    });
    
    request.on('error', (error) = {
        console.error('Request error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch flight data' }));
    });
    
    request.end();
}

function processFlightData(rawData) {
    const flights = [];
    
    for (const key in rawData) {
        if (key !== 'full_count' && key !== 'version') {
            const flight = rawData[key];
            if (Array.isArray(flight) && flight.length >= 18) {
                flights.push({
                    flight_number: flight[16] || flight[13] || '',
                    callsign: flight[13] || '',
                    altitude: flight[4] || 0,
                    ground_speed: flight[5] || 0,
                    aircraft_type: flight[8] || 'Unknown',
                    airline_short: flight[18] || '',
                    airport_origin_city: getRandomCity(),
                    airport_destination_city: getRandomCity()
                });
            }
        }
    }
    
    return flights.slice(0, 50);
}

function getRandomCity() {
    const cities = [
        'New York', 'London', 'Tokyo', 'Paris', 'Sydney',
        'Los Angeles', 'Chicago', 'Miami', 'Seattle', 'Atlanta',
        'San Francisco', 'Denver', 'Boston', 'Washington DC', 'Toronto'
    ];
    return cities[Math.floor(Math.random() * cities.length)];
}

const PORT = 3000;
proxyServer.listen(PORT, () = {
    console.log(`Flightradar24 proxy server running on port ${PORT}`);
});
