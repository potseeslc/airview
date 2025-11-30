#!/usr/bin/env node

// Script to periodically update aircraft and airport code mappings
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('📡 Aircraft & Airport Code Update Script');
console.log('========================================');

// Function to download a file using HTTPS
function downloadFile(url, callback) {
  const request = https.get(url, (response) => {
    if (response.statusCode !== 200) {
      callback(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
      return;
    }

    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      callback(null, data);
    });
  });

  request.on('error', (error) => {
    callback(error);
  });
}

// Function to update aircraft codes from OpenFlights
function updateAircraftCodes() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Updating aircraft codes from OpenFlights...');
    
    // Download aircraft data
    downloadFile('https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat', (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        // Read existing aircraft codes
        const aircraftCodesPath = path.join(__dirname, 'api', 'icao-codes.json');
        let existingCodes = {};

        if (fs.existsSync(aircraftCodesPath)) {
          existingCodes = JSON.parse(fs.readFileSync(aircraftCodesPath, 'utf8'));
        }

        // Parse the OpenFlights data
        const lines = data.split('\n');
        const newCodes = {};
        let added = 0;
        let updated = 0;

        for (const line of lines) {
          if (line.trim() === '') continue;

          // Parse the CSV-like format (with quotes)
          const match = line.match(/"([^"]*)","([^"]*)","([^"]*)"/);
          if (match) {
            const fullName = match[1];
            const icaoCode = match[3];

            // Only add entries with valid ICAO codes
            if (icaoCode && icaoCode !== '\\N' && fullName) {
              if (!existingCodes[icaoCode]) {
                added++;
              } else if (existingCodes[icaoCode] !== fullName) {
                updated++;
              }
              newCodes[icaoCode] = fullName;
            }
          }
        }

        // Merge with existing codes (new codes take precedence)
        const mergedCodes = { ...existingCodes, ...newCodes };

        // Write the updated mapping back to file
        fs.writeFileSync(aircraftCodesPath, JSON.stringify(mergedCodes, null, 2));

        console.log(`✅ Aircraft codes update complete:`);
        console.log(`   - Added: ${added} new entries`);
        console.log(`   - Updated: ${updated} existing entries`);
        console.log(`   - Total: ${Object.keys(mergedCodes).length} entries`);

        resolve();
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Function to update airport codes
function updateAirportCodes() {
  return new Promise((resolve, reject) => {
    console.log('\n🛫 Updating airport codes from datasets...');
    
    // Download airport data
    downloadFile('https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv', (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        // Read existing airport codes
        const airportCodesPath = path.join(__dirname, 'api', 'airport-codes.json');
        let existingCodes = {};

        if (fs.existsSync(airportCodesPath)) {
          existingCodes = JSON.parse(fs.readFileSync(airportCodesPath, 'utf8'));
        }

        // Parse the CSV data
        const lines = data.split('\n');
        const headers = lines[0].split(',');

        // Find indices of important columns
        const iataIndex = headers.indexOf('iata_code');
        const municipalityIndex = headers.indexOf('municipality');
        const nameIndex = headers.indexOf('name');

        const newCodes = {};
        let added = 0;
        let updated = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() === '') continue;

          const values = line.split(',');
          const iataCode = values[iataIndex];
          const municipality = values[municipalityIndex];
          const name = values[nameIndex];

          // Only add entries with valid IATA codes
          if (iataCode && iataCode.length === 3 && municipality) {
            // Use municipality if available, otherwise use the airport name
            const cityName = municipality.trim() || name.trim();

            // Only add if not already in our mapping or if we have better data
            if (!existingCodes[iataCode] || cityName.length > existingCodes[iataCode].length) {
              if (!existingCodes[iataCode]) {
                added++;
              } else {
                updated++;
              }
              newCodes[iataCode] = cityName;
            }
          }
        }

        // Merge with existing codes (new codes take precedence)
        const mergedCodes = { ...existingCodes, ...newCodes };

        // Write the updated mapping back to file
        fs.writeFileSync(airportCodesPath, JSON.stringify(mergedCodes, null, 2));

        console.log(`✅ Airport codes update complete:`);
        console.log(`   - Added: ${added} new entries`);
        console.log(`   - Updated: ${updated} existing entries`);
        console.log(`   - Total: ${Object.keys(mergedCodes).length} entries`);

        resolve();
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Run updates
async function runUpdates() {
  try {
    await updateAircraftCodes();
    await updateAirportCodes();
    
    console.log('\n🎉 All updates completed successfully!');
    console.log('🔄 Restart your Docker container to use the updated data:');
    console.log('   docker-compose down && docker-compose up -d');
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runUpdates();
}

module.exports = { updateAircraftCodes, updateAirportCodes, runUpdates };
