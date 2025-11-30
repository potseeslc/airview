class FlightDataManager {
    constructor() {
        this.currentFlight = null;
        this.currentMode = 'most';
        this.container = document.getElementById('flight-container');
        this.refreshTimeElement = document.getElementById('refresh-time');
        
        this.init();
    }

    async init() {
        // Use local sample data immediately
        this.useSampleData();
        
        // Try to get real data, but fallback to sample
        this.updateFlightData();
        
        // Auto-refresh every 60 seconds
        setInterval(() => {
            this.updateFlightData();
        }, 60000);
        
        // Update refresh time display
        this.updateRefreshTime();
        setInterval(() => {
            this.updateRefreshTime();
        }, 1000);
    }

    useSampleData() {
        // Pre-populate with sample data so UI loads immediately
        this.currentFlight = this.generateSampleFlight();
        this.currentMode = 'sample';
        this.renderFlightData();
    }

    async updateFlightData() {
        try {
            // Try to get real data (this will likely fail due to CORS)
            const response = await fetch('https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds=90,-90,180,-180', {
                mode: 'no-cors' // This bypasses CORS but gives limited response
            });
            
            // If we get real data, use it
            if (response.ok) {
                const data = await response.json();
                console.log('Got real flight data:', data);
                // Process real data here...
            } else {
                // Use sample data
                this.currentFlight = this.generateSampleFlight();
                this.currentMode = 'sample';
            }
            
        } catch (error) {
            console.log('Using sample data due to:', error.message);
            this.currentFlight = this.generateSampleFlight();
            this.currentMode = 'sample';
        }
        
        this.renderFlightData();
        this.lastUpdate = new Date();
    }

    generateSampleFlight() {
        const airlines = ['United Airlines', 'Delta', 'American Airlines', 'British Airways', 'Lufthansa'];
        const aircraft = ['Boeing 737', 'Airbus A320', 'Boeing 787', 'Airbus A350', 'Embraer E190'];
        const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'San Francisco', 'Chicago'];
        
        const randomAirline = airlines[Math.floor(Math.random() * airlines.length)];
        const randomAircraft = aircraft[Math.floor(Math.random() * aircraft.length)];
        const randomOrigin = cities[Math.floor(Math.random() * cities.length)];
        const randomDest = cities.filter(city => city !== randomOrigin)[Math.floor(Math.random() * (cities.length - 1))];
        
        return {
            flight_number: 'UA' + Math.floor(100 + Math.random() * 900),
            callsign: 'UAL' + Math.floor(100 + Math.random() * 900),
            altitude: Math.floor(25000 + Math.random() * 15000),
            ground_speed: Math.floor(400 + Math.random() * 200),
            distance: (Math.random() * 50).toFixed(1),
            aircraft_type: randomAircraft,
            airline_short: randomAirline,
            airport_origin_city: randomOrigin,
            airport_destination_city: randomDest
        };
    }

    renderFlightData() {
        if (!this.currentFlight) {
            this.container.innerHTML = '<div class="no-flights">No flights available ✈️</div>';
            return;
        }

        const flight = this.currentFlight;
        const mode = this.currentMode;
        
        // Similar rendering logic as before, but simplified...
        const html = `
            <div class="flight-header">
                <div class="flight-info">
                    <div class="mode-indicator">${mode === 'sample' ? 'Sample Flight Data' : 'Live Flight Data'}</div>
                    <div class="flight-number">${flight.flight_number}</div>
                    <div class="callsign">${flight.callsign}</div>
                    <div class="route">${flight.airport_origin_city} → ${flight.airport_destination_city}</div>
                    
                    <div class="flight-stats">
                        <div class="stat-item">
                            <div class="stat-label">Altitude</div>
                            <div class="stat-value">${flight.altitude} ft</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Ground Speed</div>
                            <div class="stat-value">${flight.ground_speed} kts</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Aircraft</div>
                            <div class="stat-value">${flight.aircraft_type}</div>
                        </div>
                    </div>
                </div>
                
                <div class="logo-container">
                    <div class="logo-image">
                        <img src="assets/fallback-airline/icon.png" alt="${flight.airline_short}" />
                    </div>
                    <div class="airline-label">${flight.airline_short}</div>
                    ${mode === 'sample' ? '<div class="most-tracked-indicator">SAMPLE DATA</div>' : ''}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    updateRefreshTime() {
        if (!this.lastUpdate) return;
        
        const now = new Date();
        const diffSec = Math.floor((now - this.lastUpdate) / 1000);
        
        this.refreshTimeElement.textContent = `Last updated: ${diffSec} seconds ago`;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlightDataManager();
});
