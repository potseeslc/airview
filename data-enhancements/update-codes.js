#!/usr/bin/env node

// Script to enhance aircraft codes mapping with comprehensive data from OpenFlights
const fs = require('fs');
const path = require('path');

// Function to download aircraft data and update the mapping
async function updateAircraftCodes() {
  try {
    // Download aircraft data from OpenFlights
    const response = await fetch('https://raw.githubusercontent.com/jpatokal/openflights/master/data/planes.dat');
    const data = await response.text();
    
    // Read existing aircraft codes
    const aircraftCodesPath = path.join(__dirname, '..', 'api', 'icao-codes.json');
    let existingCodes = {};
    
    if (fs.existsSync(aircraftCodesPath)) {
      existingCodes = JSON.parse(fs.readFileSync(aircraftCodesPath, 'utf8'));
    }
    
    // Parse the OpenFlights data
    const lines = data.split('\n');
    const newCodes = {};
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      // Parse the CSV-like format (with quotes)
      const match = line.match(/"([^"]*)","([^"]*)","([^"]*)"/);
      if (match) {
        const fullName = match[1];
        const icaoCode = match[3];
        
        // Only add entries with valid ICAO codes
        if (icaoCode && icaoCode !== '\\N' && fullName) {
          newCodes[icaoCode] = fullName;
        }
      }
    }
    
    // Merge with existing codes (new codes take precedence)
    const mergedCodes = { ...existingCodes, ...newCodes };
    
    // Write the updated mapping back to file
    fs.writeFileSync(aircraftCodesPath, JSON.stringify(mergedCodes, null, 2));
    
    console.log(`Updated aircraft codes mapping with ${Object.keys(newCodes).length} new entries`);
    console.log(`Total entries in mapping: ${Object.keys(mergedCodes).length}`);
    
    // Check if F900 is now included
    if (mergedCodes['F900']) {
      console.log(`✓ F900 is now mapped to: ${mergedCodes['F900']}`);
    } else {
      console.log('Note: F900 was not found in the OpenFlights data');
    }
    
  } catch (error) {
    console.error('Error updating aircraft codes:', error);
  }
}

// Function to update airport codes with more comprehensive data
async function updateAirportCodes() {
  try {
    // Download airport data from the datasets repository
    const response = await fetch('https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv');
    const data = await response.text();
    
    // Read existing airport codes
    const airportCodesPath = path.join(__dirname, '..', 'api', 'airport-codes.json');
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
    let addedCount = 0;
    
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
        
        // Only add if not already in our mapping or if we're replacing a generic entry
        if (!existingCodes[iataCode] || cityName.length > existingCodes[iataCode].length) {
          newCodes[iataCode] = cityName;
          addedCount++;
        }
      }
    }
    
    // Merge with existing codes (new codes take precedence)
    const mergedCodes = { ...existingCodes, ...newCodes };
    
    // Write the updated mapping back to file
    fs.writeFileSync(airportCodesPath, JSON.stringify(mergedCodes, null, 2));
    
    console.log(`Updated airport codes mapping with ${addedCount} new entries`);
    console.log(`Total entries in mapping: ${Object.keys(mergedCodes).length}`);
    
  } catch (error) {
    console.error('Error updating airport codes:', error);
  }
}

// Run both updates
async function runUpdates() {
  console.log('Updating aircraft codes...');
  await updateAircraftCodes();
  
  console.log('\nUpdating airport codes...');
  await updateAirportCodes();
  
  console.log('\nData updates completed!');
}

runUpdates();
