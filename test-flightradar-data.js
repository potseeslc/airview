// Test script to see what FlightRadar24 data looks like
const FlightRadar24API = require('./api/flightradar24-integration');

async function testFlightRadarData() {
  console.log('Testing FlightRadar24 data...');
  
  const api = new FlightRadar24API();
  
  // Test with coordinates around Denver (your home location)
  const lat = 39.8121035;
  const lon = -105.1125547;
  const radiusKm = 75; // 75km radius
  
  // Convert radius to bounding box
  const latDiff = radiusKm / 111.0; // Approximate km per degree latitude
  const lonDiff = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
  
  const latMin = lat - latDiff;
  const latMax = lat + latDiff;
  const lonMin = lon - lonDiff;
  const lonMax = lon + lonDiff;
  
  console.log(`Fetching flights in bounds: ${latMin},${lonMin} to ${latMax},${lonMax}`);
  
  try {
    const flights = await api.getFlightsInBounds(latMin, latMax, lonMin, lonMax);
    
    console.log(`\nFound ${flights.length} flights`);
    
    if (flights.length > 0) {
      console.log('\nFirst 5 flights with their aircraft types:');
      flights.slice(0, 5).forEach((flight, index) => {
        console.log(`${index + 1}. ${flight.flight_number} - ${flight.aircraft_type} (${flight.registration || 'No reg'})`);
        console.log(`   Route: ${flight.departure} → ${flight.arrival}`);
        console.log(`   Airline: ${flight.airline}`);
        console.log(`   Is cargo: ${flight.is_cargo}, Is private: ${flight.is_private}`);
        console.log('');
      });
      
      // Look for any F900 or interesting aircraft types
      const interestingAircraft = flights.filter(flight => 
        flight.aircraft_type === 'F900' || 
        flight.aircraft_type.includes('FALCON') ||
        flight.aircraft_type.includes('GULF') ||
        flight.aircraft_type.includes('LEAR') ||
        flight.aircraft_type.includes('BOMBARDIER') ||
        flight.is_private ||
        flight.is_cargo
      );
      
      if (interestingAircraft.length > 0) {
        console.log('\nInteresting aircraft found:');
        interestingAircraft.forEach(flight => {
          console.log(`- ${flight.flight_number}: ${flight.aircraft_type}`);
        });
      } else {
        console.log('\nNo particularly interesting aircraft found in this batch.');
      }
    }
  } catch (error) {
    console.error('Error fetching FlightRadar24 data:', error.message);
  }
}

testFlightRadarData();
