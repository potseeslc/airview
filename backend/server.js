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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const CONFIG_FILE = path.join(__dirname, 'config.json');
const defaultConfig = {
    home: { 
        latitude: 40.7484405, 
        longitude: -73.9856644, 
        radius: 75,
        minAltitude: 10000,
        maxAltitude: 45000
    },
    settings: { 
        refreshInterval: 60000
    }
};

// Load configuration from file or use default
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const configFile = fs.readFileSync(CONFIG_FILE, 'utf8');
            return { ...defaultConfig, ...JSON.parse(configFile) };
        } else {
            console.log('Config file not found, using defaults and creating new config file');
            saveConfig(defaultConfig);
            return defaultConfig;
        }
    } catch (error) {
        console.error('Error loading config, using defaults:', error.message);
        return defaultConfig;
    }
}

// Save configuration to file
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error.message);
        return false;
    }
}

// Validate coordinates
function validateCoordinates(lat, lon) {
    if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Coordinates must be valid numbers');
    }
    
    if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
    }
    
    if (lon < -180 || lon > 180) {
        throw new Error('Longitude must be between -180 and 180');
    }
}

// Generate realistic sample flight data
function generateRealisticFlights(lat, lon, count) {
    const flights = [];
    const airlines = ['UA', 'AA', 'DL', 'WN', 'B6', 'NK', 'F9'];
    const aircraftTypes = ['Boeing 737', 'Airbus A320', 'Boeing 787', 'Airbus A350', 'Boeing 777', 'Embraer E175'];
    const origins = ['DEN', 'LAX', 'SFO', 'ORD', 'JFK', 'ATL'];
    const destinations = ['PHX', 'SEA', 'MSP', 'BOS', 'MIA', 'DFW'];
    
    for (let i = 0; i < count; i++) {
        // Generate coordinates slightly offset from the center
        const offsetLat = lat + (Math.random() - 0.5) * 0.1;
        const offsetLon = lon + (Math.random() - 0.5) * 0.1;
        
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const flightNumber = `${airline}${Math.floor(Math.random() * 9000) + 1000}`;
        const aircraftType = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
        const origin = origins[Math.floor(Math.random() * origins.length)];
        const destination = destinations[Math.floor(Math.random() * destinations.length)];
        
        flights.push({
            icao24: `a${Math.floor(Math.random() * 1000000).toString(16)}`,
            callsign: flightNumber,
            origin_country: 'United States',
            time_position: Math.floor(Date.now() / 1000),
            last_contact: Math.floor(Date.now() / 1000),
            longitude: offsetLon,
            latitude: offsetLat,
            baro_altitude: Math.floor(Math.random() * 30000) + 10000,
            on_ground: false,
            velocity: Math.floor(Math.random() * 200) + 300,
            true_track: Math.floor(Math.random() * 360),
            vertical_rate: Math.floor(Math.random() * 1000) - 500,
            sensors: null,
            geo_altitude: Math.floor(Math.random() * 30000) + 10000,
            squawk: null,
            spi: false,
            position_source: 1,
            aircraft_type: aircraftType,
            flight_number: flightNumber,
            origin: origin,
            destination: destination,
            route: `${origin} → ${destination}`,
            airline: airline,
            departure: origin,
            arrival: destination
        });
    }
    
    return flights;
}

// Fetch flights using FlightRadar24 API
async function fetchFlights(lat, lon, radius, minAlt, maxAlt) {
    try {
        // Create bounding box from center point and radius
        // Approximate 1 degree = 111 km, so radius in degrees = radius / 111
        const radiusInDegrees = radius / 111;
        const latMin = lat - radiusInDegrees;
        const latMax = lat + radiusInDegrees;
        const lonMin = lon - radiusInDegrees;
        const lonMax = lon + radiusInDegrees;
        
        const flightRadarAPI = new FlightRadar24API();
        const apiFlights = await flightRadarAPI.getFlightsInBounds(latMin, latMax, lonMin, lonMax);
        
        // Filter flights by altitude
        const filteredFlights = apiFlights.filter(flight => {
            // Filter out on-ground flights
            if (flight.on_ground) return false;
            
            // Filter by altitude range
            const altitude = flight.altitude || flight.baro_altitude || flight.geo_altitude;
            if (altitude === undefined) return true; // If no altitude data, include it
            
            return altitude >= minAlt && altitude <= maxAlt;
        });
        
        console.log(`🔍 Fetched ${apiFlights.length} flights, ${filteredFlights.length} after filtering`);
        return filteredFlights;
    } catch (error) {
        console.error('❌ Error fetching flights:', error.message);
        return [];
    }
}

// Initialize config
let config = loadConfig();
app.get('/admin', (req, res) => {
    console.log('Serving new admin interface');
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

app.get('/admin-legacy', (req, res) => {
    console.log('Serving legacy admin interface');
    res.sendFile(path.join(__dirname, '../admin/index.html.backup'));
});

app.get('/admin/config', (req, res) => {
    res.json({ success: true, config });
});

app.get('/test', (req, res) => {
    console.log('Test route called');
    res.send('Test route working');
});

app.get('/admin/test', (req, res) => {
    console.log('Admin test route called');
    res.send('Admin test route working');
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

// Serve flight display HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/index.html'));
});

// Serve static files from multiple directories
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/api', express.static(path.join(__dirname, '../api')));
app.use('/html', express.static(path.join(__dirname, '../html')));

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Using FlightRadar24 API only (no OpenSky)`);
    console.log(`📍 Current location: ${config.home.latitude}, ${config.home.longitude}`);
    console.log(`🔧 Route handlers registered: /admin, /admin-legacy, /test`);
});
