// Flight Data Display - Kiosk Mode with Python Enhancement Support
let lastUpdateTime;
const refreshInterval = 30000;

// Home location from config
const HOME_LAT = 39.8121035;
const HOME_LON = -105.1125547;

// Load code mappings for aircraft type and airline name enhancement
let icaoCodes = {};
let airlineCodes = {};

async function loadCodeMappings() {
    try {
        const icaoResponse = await fetch('/api/icao-codes.json');
        icaoCodes = await icaoResponse.json();
        console.log(`Loaded ${Object.keys(icaoCodes).length} aircraft type mappings`);
        
        const airlineResponse = await fetch('/api/airline-codes.json');
        airlineCodes = await airlineResponse.json();
        console.log(`Loaded ${Object.keys(airlineCodes).length} airline name mappings`);
    } catch (error) {
        console.error('Failed to load code mappings:', error);
    }
}

async function fetchFlightData() {
    try {
        const response = await fetch('/api/flights/local');
        const data = await response.json();
        
        if (data.success) {
            const flight = data.flights && data.flights.length > 0 ? data.flights[0] : null;
            displayFlightData(flight, data.mode, data.source, data.source.includes('Python'));
            updateLastUpdateTime(data.source || data.mode);
        } else {
            displayError('Failed to fetch flight data');
        }
    } catch (error) {
        console.error('Error fetching flight data:', error);
        displayError('Connection error');
    }
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

function displayFlightData(flight, mode, source, isPythonEnhanced = false) {
    const container = document.getElementById('flight-container');
    
    if (!flight) {
        container.innerHTML = '<div class="no-flights">No flight data available</div>';
        return;
    }
    
    // Handle both enhanced and non-enhanced flight data
    const isLive = mode === 'live';
    const altitude = Math.round(flight.altitude || 0);
    const speed = Math.round(flight.speed || 0);
    const airlineCode = flight.airline || 'Unknown';
    
    // Calculate distance from home location if coordinates are available
    let distanceInfo = '';
    if (flight.latitude && flight.longitude) {
        const distance = calculateDistance(HOME_LAT, HOME_LON, flight.latitude, flight.longitude);
        distanceInfo = ` (${Math.round(distance)} miles away)`;
    }
    
    // Enhanced source display - show flight location info
    let sourceDisplay = 'SAMPLE DATA';
    if (isLive) {
        if (source && source.includes('FLIGHTRADAR24')) {
            sourceDisplay = `LIVE DATA - FLIGHTRADAR24 Flight Closest to your current Location${distanceInfo}`;
        } else {
            sourceDisplay = `LIVE DATA - OPENSKY Flight Closest to your current Location${distanceInfo}`;
        }
    }
    
    // Enhanced aircraft information
    let aircraftDisplay = 'Aircraft Info';
    if (flight.aircraft_type && flight.aircraft_type !== 'Unknown') {
        // Use ICAO code mapping if available, otherwise use the provided aircraft type
        aircraftDisplay = icaoCodes[flight.aircraft_type] || flight.aircraft_type;
    }
    
    // Enhanced route information
    let routeDisplay = 'En Route';
    if (flight.route) {
        routeDisplay = flight.route;
    } else if (flight.departure && flight.arrival) {
        routeDisplay = `${flight.departure} → ${flight.arrival}`;
    }
    
    container.innerHTML = createFlightCard(flight, sourceDisplay, aircraftDisplay, routeDisplay);
}

function createFlightCard(flight, sourceDisplay, aircraftDisplay, routeDisplay) {
    const altitude = Math.round(flight.altitude || 0);
    const speed = Math.round(flight.speed || 0);
    const airlineCode = flight.airline || 'Unknown';
    const flightNumber = flight.flight_number || flight.callsign || 'N/A';
    
    // Map airline codes to full names
    const airlineNames = {
        'UA': 'United Airlines',
        'AA': 'American Airlines', 
        'DL': 'Delta Air Lines',
        'WN': 'Southwest Airlines',
        'AS': 'Alaska Airlines',
        'B6': 'JetBlue',
        'SW': 'Southwest Airlines',
        'F9': 'Frontier Airlines',
        // Cargo airlines
        'FDX': 'FedEx',
        'UPS': 'UPS',
        'GTI': 'Atlas Air',
        'AMZ': 'Amazon Air',
        'QFA': 'Qantas Freight',
        'CKK': 'China Cargo'
    };
    
    // Map short airline codes to IATA codes for logo filenames
    const airlineIATACodes = {
        'UA': 'UAL',
        'AA': 'AAL',
        'DL': 'DAL',
        'WN': 'SWA',
        'AS': 'ASA',
        'B6': 'JBU',
        'SW': 'SWA',
        'F9': 'FFT',
        // Cargo airlines
        'FDX': 'FDX',
        'UPS': 'UPS',
        'GTI': 'GTI',
        'AMZ': 'AMZ',
        'QFA': 'QFA',
        'CKK': 'CKK'
    };
    
    // Determine display flight number and airline name
    let displayFlightNumber = flightNumber;
    let airlineName = airlineCodes[airlineCode] || airlineNames[airlineCode] || airlineCode;
    let airlineIATACode = airlineIATACodes[airlineCode] || airlineCode;
    
    // Special handling for private aircraft
    if (flight.is_private) {
        displayFlightNumber = flight.registration || flightNumber;
        airlineName = 'Private Aircraft';
        airlineIATACode = 'PRIVATE'; // We'll use a generic private aircraft logo
    }
    // Special handling for cargo flights
    else if (flight.is_cargo) {
        displayFlightNumber = flightNumber;
        // Airline name is already set from the mapping above
    }
    
    return `
        <div class="flight-header">
            <div class="flight-info">
                <div class="mode-indicator">${sourceDisplay}</div>
                <div class="flight-number">${displayFlightNumber}</div>
                <div class="callsign">${flight.callsign || ''}</div>
                <div class="route">${routeDisplay}</div>
                
                <div class="flight-stats">
                    <div class="stat-item">
                        <div class="stat-label">Altitude</div>
                        <div class="stat-value">${altitude ? altitude.toLocaleString() + ' ft' : 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Ground Speed</div>
                        <div class="stat-value">${speed ? speed + ' kts' : 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Aircraft</div>
                        <div class="stat-value">${aircraftDisplay}</div>
                    </div>
                </div>
            </div>
            
            <div class="logo-container">
                <div class="logo-image">
                    <img src="/assets/flightaware_logos/${airlineIATACode}.png" alt="${airlineName} logo" 
                         onerror="this.style.display='none'">
                </div>
                <div class="airline-label">${airlineName}</div>
                <div class="most-tracked-indicator">${flight.origin_country || 'International'}</div>
            </div>
        </div>
    `;
}

function displayError(message) {
    const container = document.getElementById('flight-container');
    container.innerHTML = '<div class="no-flights" style="color: #f87171;">' + message + '</div>';
}

function updateLastUpdateTime(source) {
    lastUpdateTime = new Date();
    const timeEl = document.getElementById('refresh-time');
    if (timeEl) {
        timeEl.textContent = 'Last updated: ' + lastUpdateTime.toLocaleTimeString() + ' (' + source + ')';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Flight tracker with FlightRadar24 enhancement initialized');
    loadCodeMappings().then(() => {
        fetchFlightData();
        setInterval(fetchFlightData, refreshInterval);
    });
});

// Add refresh time element if not exists
if (!document.getElementById('refresh-time')) {
    const refreshEl = document.createElement('div');
    refreshEl.id = 'refresh-time';
    refreshEl.className = 'refresh-time';
    document.body.appendChild(refreshEl);
}
