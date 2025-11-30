const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const { spawn } = require('child_process');

// FlightRadar24 Integration
const FlightRadar24API = require('../api/flightradar24-integration');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from multiple directories
app.use(express.static(path.join(__dirname, '..')));
app.use('/api', express.static(path.join(__dirname, '../api')));
app.use('/html', express.static(path.join(__dirname, '../html')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Configuration
const CONFIG_FILE = path.join(__dirname, 'config.json');
const defaultConfig = {
    home: { 
        latitude: 39.8121035, 
        longitude: -105.1125547, 
        radius: 75,
        minAltitude: 10000,
        maxAltitude: 45000
    },
    settings: { 
        refreshInterval: 60000
    }
};

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
        return defaultConfig;
    } catch (error) {
        return defaultConfig;
    }
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        return false;
    }
}

function validateCoordinates(lat, lon) {
    if (Math.abs(lat) > 90) throw new Error(`Invalid latitude: ${lat}`);
    if (Math.abs(lon) > 180) throw new Error(`Invalid longitude: ${lon}`);
    return true;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

let config = loadConfig();

// FlightRadar24 API caching for rate limiting
let flightRadar24FlightsCache = null;
let lastFlightRadar24Fetch = 0;
const FLIGHTRADAR24_CACHE_INTERVAL = 30000; // 30 seconds

// FlightRadar24 API implementation (no authentication required)
async function getFlightRadar24Flights(lat, lon, radius, minAltitude = 10000, maxAltitude = 45000) {
    // Check cache first
    if (flightRadar24FlightsCache && (Date.now() - lastFlightRadar24Fetch) < FLIGHTRADAR24_CACHE_INTERVAL) {
        console.log(`📦 Using cached FlightRadar24 data (cache age: ${Date.now() - lastFlightRadar24Fetch}ms)`);
        return flightRadar24FlightsCache;
    }
    
    try {
        console.log(`🔍 Requesting FlightRadar24 API for lat=${lat}, lon=${lon}, radius=${radius}km`);
        
        // Calculate bounding box
        const latDelta = radius / 111.0;
        const lonDelta = radius / (111.0 * Math.abs(Math.cos(lat * Math.PI/180)));
        
        const latMin = lat - latDelta;
        const latMax = lat + latDelta;
        const lonMin = lon - lonDelta;
        const lonMax = lon + lonDelta;
        
        // Create FlightRadar24 API client
        const fr24 = new FlightRadar24API();
        
        // Get flights within bounds
        const flights = await fr24.getFlightsInBounds(latMin, latMax, lonMin, lonMax);
        
        if (flights && flights.length > 0) {
            console.log(`📊 FlightRadar24 API returned ${flights.length} total aircraft`);
            
            // Filter flights based on altitude and other criteria
            const filteredFlights = flights
                .filter(flight => 
                    flight.altitude >= minAltitude && 
                    flight.altitude <= maxAltitude &&
                    flight.latitude && flight.longitude && // Valid coordinates
                    !flight.on_ground // Only airborne flights
                );
            
            console.log(`✅ FlightRadar24 API returned ${filteredFlights.length} filtered flights`);
            
            // Update cache
            flightRadar24FlightsCache = filteredFlights;
            lastFlightRadar24Fetch = Date.now();
            return filteredFlights;
        }
    } catch (error) {
        console.log('❌ FlightRadar24 API failed:', error.message);
    }
    return null;
}

// Main flight data fetching function - simplified for FlightRadar24 only
async function fetchFlights(lat, lon, radius, minAltitude, maxAltitude) {
    console.log(`🛫 Using FlightRadar24 API`);
    
    let apiFlights = await getFlightRadar24Flights(lat, lon, radius, minAltitude, maxAltitude);
    
    // Sort flights by distance from the specified location (closest first)
    if (apiFlights && apiFlights.length > 0) {
        console.log(`📏 Sorting ${apiFlights.length} flights by distance from (${lat}, ${lon})`);
        
        apiFlights.sort((a, b) => {
            const distA = calculateDistance(lat, lon, a.latitude, a.longitude);
            const distB = calculateDistance(lat, lon, b.latitude, b.longitude);
            return distA - distB;
        });
        
        console.log(`✅ Flights sorted - closest flight is ${calculateDistance(lat, lon, apiFlights[0].latitude, apiFlights[0].longitude).toFixed(1)} miles away`);
    }
    
    return apiFlights;
}

// Enhanced sample data generator
let sampleFlightsCache = null;
let lastSampleUpdate = 0;
const SAMPLE_UPDATE_INTERVAL = 10000;

function generateRealisticFlights(lat, lon, count = 4) {
    if (sampleFlightsCache && (Date.now() - lastSampleUpdate) < SAMPLE_UPDATE_INTERVAL) {
        return sampleFlightsCache;
    }
    
    const airlines = ['UA', 'AA', 'DL', 'WN', 'AS', 'B6', 'F9', 'G4'];
    const flights = Array.from({ length: count }, (_, i) => {
        const airline = airlines[i % airlines.length];
        const flightNum = Math.floor(100 + Math.random() * 900);
        
        return {
            id: 'sample_' + i,
            latitude: lat + (Math.random() - 0.5) * 0.2,
            longitude: lon + (Math.random() - 0.5) * 0.2,
            track: Math.floor(Math.random() * 360),
            altitude: 28000 + (i * 2000) + Math.random() * 1000,
            speed: 420 + (i * 20) + Math.random() * 40,
            flight_number: airline + flightNum,
            aircraft_type: 'Enhanced: ' + ['A320', 'B737', 'B738', 'A319'][i % 4],
            callsign: airline + flightNum,
            origin: 'DEN',
            route: 'DEN → ' + ['ORD', 'LAX', 'JFK', 'SFO'][i % 4],
            airline: airline,
            vertical_speed: Math.random() > 0.5 ? 500 + Math.random() * 1000 : -500 - Math.random() * 1000,
        };
    });
    
    sampleFlightsCache = flights;
    lastSampleUpdate = Date.now();
    return flights;
}

// API Routes
app.get('/admin/config', (req, res) => {
    res.json({ success: true, config });
});

app.post('/admin/config', (req, res) => {
    const newConfig = req.body;
    if (newConfig.home && newConfig.home.latitude && newConfig.home.longitude) {
        try {
            validateCoordinates(newConfig.home.latitude, newConfig.home.longitude);
            
            config = { ...config, ...newConfig };
            if (saveConfig(config)) {
                res.json({ success: true, config, message: 'Configuration saved successfully!' });
            } else {
                res.json({ success: false, message: 'Failed to save configuration' });
            }
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    } else {
        res.json({ success: false, message: 'Invalid data: latitude and longitude are required' });
    }
});

app.get('/api/flights/local', async (req, res) => {
    try {
        let { 
            lat = config.home.latitude, 
            lon = config.home.longitude, 
            radius = config.home.radius,
            minAlt = config.home.minAltitude,
            maxAlt = config.home.maxAltitude
        } = req.query;
        
        validateCoordinates(parseFloat(lat), parseFloat(lon));
        
        console.log(`🔍 Fetching flights for: ${lat}, ${lon}, radius=${radius}km`);
        console.log(`📏 Altitude filter: ${minAlt} - ${maxAlt} feet`);
        
        // Use API data primarily - FlightRadar24 only
        let apiFlights = await fetchFlights(lat, lon, radius, minAlt, maxAlt);
        
        // Generate sample data for fallback
        const sampleFlights = generateRealisticFlights(lat, lon, 4);
        
        if (apiFlights && apiFlights.length > 0) {
            console.log(`✅ API returned ${apiFlights.length} filtered flights`);
            res.json({ 
                success: true, 
                flights: apiFlights.slice(0, 4),
                mode: 'live',
                count: apiFlights.length,
                source: 'FLIGHTRADAR24',
                filters: { minAltitude: minAlt, maxAltitude: maxAlt }
            });
        } else {
            console.log('🔄 Using sample data');
            res.json({ 
                success: true, 
                flights: sampleFlights, 
                mode: 'demo',
                source: 'Sample Data',
                refresh_rate: '10 seconds'
            });
        }
        
    } catch (error) {
        console.error('❌ Flight API error:', error.message);
        const sampleFlights = generateRealisticFlights(config.home.latitude, config.home.longitude, 4);
        res.json({ 
            success: true, 
            error: error.message, 
            flights: sampleFlights, 
            mode: 'demo',
            source: 'Fallback Sample Data'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve admin panel HTML
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Serve flight display HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Using FlightRadar24 API only (no OpenSky)`);
    console.log(`📍 Current location: ${config.home.latitude}, ${config.home.longitude}`);
});
