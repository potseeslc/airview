/**
 * Test script for FlightRadar24 integration
 * This script tests the FlightRadar24 API integration without needing to run the full server
 */

const FlightRadar24API = require('./flightradar24-integration');

async function testFlightRadar24() {
    console.log('🔍 Testing FlightRadar24 API integration...');
    
    try {
        // Create FlightRadar24 API client
        const fr24 = new FlightRadar24API();
        
        // Test with Denver area (your home location)
        const lat = 39.8121035;
        const lon = -105.1125547;
        const radius = 50; // 50km radius
        
        // Calculate bounding box
        const latDelta = radius / 111.0;
        const lonDelta = radius / (111.0 * Math.abs(Math.cos(lat * Math.PI/180)));
        
        const latMin = lat - latDelta;
        const latMax = lat + latDelta;
        const lonMin = lon - lonDelta;
        const lonMax = lon + lonDelta;
        
        console.log(`🔍 Fetching flights in bounds: ${latMin},${lonMin} to ${latMax},${lonMax}`);
        
        // Get flights within bounds
        const flights = await fr24.getFlightsInBounds(latMin, latMax, lonMin, lonMax);
        
        if (flights && flights.length > 0) {
            console.log(`✅ FlightRadar24 API returned ${flights.length} aircraft`);
            
            // Show details of first few flights
            console.log('\n📋 First 3 flights:');
            flights.slice(0, 3).forEach((flight, index) => {
                console.log(`  ${index + 1}. ${flight.callsign || 'N/A'} (${flight.icao24})`);
                console.log(`     Position: ${flight.latitude}, ${flight.longitude}`);
                console.log(`     Altitude: ${flight.altitude} ft`);
                console.log(`     Speed: ${flight.speed} kts`);
                console.log(`     Aircraft: ${flight.aircraft_type || 'Unknown'}`);
                console.log(`     Route: ${flight.origin || 'N/A'} → ${flight.destination || 'N/A'}`);
                console.log();
            });
            
            return true;
        } else {
            console.log('⚠️ No flights returned from FlightRadar24 API');
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing FlightRadar24 integration:', error.message);
        return false;
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testFlightRadar24()
        .then(success => {
            if (success) {
                console.log('\n✅ FlightRadar24 integration test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ FlightRadar24 integration test failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testFlightRadar24 };
