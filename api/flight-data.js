class FlightDataManager {
    constructor() {
        this.api = new FlightRadarAPI();
        this.currentFlight = null;
        this.currentMode = 'most'; // 'local' or 'most'
        this.container = document.getElementById('flight-container');
        this.refreshTimeElement = document.getElementById('refresh-time');
        
        // Default coordinates (you can customize these)
        this.homeLatitude = 37.7749; // San Francisco
        this.homeLongitude = -122.4194;
        
        this.init();
    }

    async init() {
        await this.updateFlightData();
        
        // Auto-refresh every 60 seconds
        setInterval(() = {
            this.updateFlightData();
        }, this.api.refreshInterval);
        
        // Also update refresh time display
        this.updateRefreshTime();
        setInterval(() = {
            this.updateRefreshTime();
        }, 1000);
    }

    async updateFlightData() {
        try {
            // Try to get local flights first
            const localFlights = await this.api.getFlightsInArea(this.homeLatitude, this.homeLongitude);
            const bestFlight = this.api.findBestFlight(localFlights);
            
            if (bestFlight && (bestFlight.altitude || 0) > 10000) {
                this.currentFlight = bestFlight;
                this.currentMode = 'local';
            } else {
                // Fallback to most tracked flights
                const mostFlights = await this.api.getMostTrackedFlights();
                this.currentFlight = mostFlights[0] || this.api.generateSampleData()[0];
                this.currentMode = 'most';
            }
            
            this.renderFlightData();
            this.lastUpdate = new Date();
            
        } catch (error) {
            console.error('Error updating flight data:', error);
            // Use sample data as fallback
            this.currentFlight = this.api.generateSampleData()[0];
            this.currentMode = 'most';
            this.renderFlightData();
        }
    }

    renderFlightData() {
        if (!this.currentFlight) {
            this.container.innerHTML = '<div class="no-flights">No flights available ✈️</div>';
            return;
        }

        const flight = this.currentFlight;
        const mode = this.currentMode;
        
        // Extract flight data safely
        const flightNumber = flight.flight_number || '';
        const callsign = flight.callsign || '';
        const airlineShort = flight.airline_short || '';
        const origin = flight.airport_origin_city || 'Unknown';
        const destination = flight.airport_destination_city || 'Unknown';
        const altitude = Math.round(flight.altitude || 0);
        const groundSpeed = Math.round(flight.ground_speed || 0);
        const aircraft = flight.aircraft_type || 'Unknown';
        const distance = Math.round((flight.distance || 999999) * 10) / 10;

        // Derive ICAO for logo
        let icao = '';
        if (callsign.length >= 3) {
            icao = callsign.substring(0, 3).toUpperCase();
        } else if (flightNumber.length >= 3) {
            icao = flightNumber.substring(0, 3).toUpperCase();
        }

        // Determine logo and airline label
        let logoUrl = 'assets/fallback-airline/icon.png';
        let airlineLabel = 'Unknown airline';

        if (flightNumber.startsWith('N') || callsign.startsWith('N')) {
            logoUrl = 'assets/private-plane/private-plane.png';
            airlineLabel = 'Private aircraft';
        } else if (airlineShort && airlineShort.toLowerCase() !== 'unknown') {
            airlineLabel = airlineShort;
            if (icao) {
                logoUrl = `assets/flightaware_logos/${icao}.png`;
            }
        } else if (icao) {
            airlineLabel = icao;
            logoUrl = `assets/flightaware_logos/${icao}.png`;
        }

        // Header text based on mode
        const headerText = mode === 'local' 
            ? `Closest flight • ${distance} km from home`
            : 'Most tracked flight on Flightradar24';

        const html = `
            <div class="flight-header">
                <div class="flight-info">
                    <div class="mode-indicator">${headerText}</div>
                    <div class="flight-number">${flightNumber || callsign}</div>
                    <div class="callsign">${callsign}</div>
                    <div class="route">${origin} → ${destination}</div>
                    
                    <div class="flight-stats">
                        <div class="stat-item">
                            <div class="stat-label">Altitude</div>
                            <div class="stat-value">${altitude} ft</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Ground Speed</div>
                            <div class="stat-value">${groundSpeed} kts</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Aircraft</div>
                            <div class="stat-value">${aircraft}</div>
                        </div>
                    </div>
                </div>
                
                <div class="logo-container">
                    <div class="logo-image">
                        <img src="${logoUrl}" alt="${airlineLabel}" onerror="this.src='assets/fallback-airline/icon.png'" />
                    </div>
                    <div class="airline-label">${airlineLabel}</div>
                    ${mode === 'most' ? '<div class="most-tracked-indicator">MOST TRACKED FLIGHT</div>' : ''}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    updateRefreshTime() {
        if (!this.lastUpdate) return;
        
        const now = new Date();
        const diffMs = now - this.lastUpdate;
        const diffSec = Math.floor(diffMs / 1000);
        
        this.refreshTimeElement.textContent = `Last updated: ${diffSec} seconds ago`;
    }

    // Method to update home coordinates
    setHomeCoordinates(lat, lon) {
        this.homeLatitude = lat;
        this.homeLongitude = lon;
        this.updateFlightData();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () = {
    new FlightDataManager();
});
