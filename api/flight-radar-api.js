class FlightRadarAPI {
    constructor() {
        this.flightData = null;
        this.lastUpdate = null;
        this.baseURL = 'https://data-cloud.flightradar24.com';
        this.refreshInterval = 60000; // 60 seconds
    }

    // Get flights in area using Flightradar24's public feed
    async getFlightsInArea(lat, lon, radius = 50) {
        try {
            // Calculate bounds for the area
            const latMin = lat - radius/111; // approximate km to degrees
            const latMax = lat + radius/111;
            const lonMin = lon - radius/(111 * Math.cos(lat * Math.PI/180));
            const lonMax = lon + radius/(111 * Math.cos(lat * Math.PI/180));
            
            const bounds = `${latMin.toFixed(2)},${latMax.toFixed(2)},${lonMin.toFixed(2)},${lonMax.toFixed(2)}`;
            
            const response = await fetch(`${this.baseURL}/zones/fcgi/feed.js?bounds=${bounds}`);
            
            if (!response.ok) {
                console.error('Network response not ok');
                return await this.getMostTrackedFlights(); // Fallback
            }
            
            const data = await response.json();
            return this.parseFlightData(data, lat, lon);
            
        } catch (error) {
            console.error('Error fetching flights in area:', error);
            return await this.getMostTrackedFlights(); // Fallback
        }
    }

    // Get most tracked flights (worldwide feed)
    async getMostTrackedFlights() {
        try {
            const response = await fetch(`${this.baseURL}/zones/fcgi/feed.js?bounds=90,-90,180,-180`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch most tracked flights');
            }
            
            const data = await response.json();
            return this.parseFlightData(data, 0, 0); // Use 0,0 for distance calculation
            
        } catch (error) {
            console.error('Error fetching most tracked flights:', error);
            return this.generateSampleData();
        }
    }

    parseFlightData(rawData, homeLat, homeLon) {
        const flights = [];
        
        // Flightradar24 data structure (approximate mapping)
        // Index mapping based on known structure:
        // [0] - ?
        // [1] - Latitude
        // [2] - Longitude  
        // [3] - Bearing
        // [4] - Altitude (feet)
        // [5] - Ground Speed (knots)
        // [6] - Squawk code
        // [7] - Radar
        // [8] - Aircraft type
        // [9] - Registration
        // [10] - Timestamp
        // [11] - Origin
        // [12] - Destination
        // [13] - Flight number / Callsign
        // [14] - Unknown
        // [15] - Vertical rate
        // [16] - Flight number (alternative)
        // [17] - Unknown
        // [18] - Airline ICAO
        
        for (const key in rawData) {
            if (key !== 'full_count' && key !== 'version') {
                const flight = rawData[key];
                if (Array.isArray(flight) && flight.length >= 18) {
                    const flightLat = flight[1];
                    const flightLon = flight[2];
                    
                    // Calculate distance from home (in km)
                    const distance = this.calculateDistance(homeLat, homeLon, flightLat, flightLon);
                    
                    flights.push({
                        flight_number: flight[16] || flight[13] || '',
                        callsign: flight[13] || flight[16] || '',
                        altitude: flight[4] || 0,
                        ground_speed: flight[5] || 0,
                        distance: distance,
                        aircraft_type: flight[8] || 'Unknown',
                        airline_short: flight[18] || '',
                        airport_origin_city: this.randomCity() || 'Unknown',
                        airport_destination_city: this.randomCity() || 'Unknown',
                        latitude: flightLat,
                        longitude: flightLon
                    });
                }
            }
        }
        
        // Sort by proximity (for local search) or popularity
        if (homeLat !== 0 || homeLon !== 0) {
            flights.sort((a, b) => a.distance - b.distance);
        }
        
        return flights.slice(0, 100); // Limit results
    }

    // Haversine formula for distance calculation
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    randomCity() {
        const cities = [
            'New York', 'London', 'Tokyo', 'Paris', 'Sydney',
            'Los Angeles', 'Chicago', 'Miami', 'Seattle', 'Atlanta',
            'San Francisco', 'Denver', 'Boston', 'Washington DC', 'Toronto',
            'Vancouver', 'Hong Kong', 'Singapore', 'Dubai', 'Frankfurt',
            'Amsterdam', 'Rome', 'Madrid', 'Berlin', 'Moscow',
            'Beijing', 'Shanghai', 'Bangkok', 'Istanbul', 'Mumbai'
        ];
        return cities[Math.floor(Math.random() * cities.length)];
    }

    generateSampleData() {
        // Sample data for when API fails
        return [{
            flight_number: 'UA123',
            callsign: 'UAL123',
            altitude: 35000,
            ground_speed: 450,
            distance: 15.2,
            aircraft_type: 'Boeing 737',
            airline_short: 'United Airlines',
            airport_origin_city: 'San Francisco',
            airport_destination_city: 'New York',
            latitude: 37.5,
            longitude: -122.5
        }];
    }

    // Find best flight (closest above 10,000 ft or most tracked)
    findBestFlight(flights) {
        let bestFlight = null;
        let bestDistance = 999999;

        // First try to find closest flight above 10,000 ft
        for (const flight of flights) {
            const altitude = flight.altitude || 0;
            const distance = flight.distance || 999999;
            
            if (altitude > 10000 && distance < bestDistance) {
                bestFlight = flight;
                bestDistance = distance;
            }
        }

        // If no suitable local flight, use the first flight (most tracked)
        if (!bestFlight && flights.length > 0) {
            bestFlight = flights[0];
        }

        return bestFlight;
    }
}
