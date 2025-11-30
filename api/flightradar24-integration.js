/**
 * FlightRadar24 Integration for Flight Tracker WebApp
 * This module provides an alternative to OpenSky API that doesn't require authentication
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load airport and aircraft mappings
const airportCodes = JSON.parse(fs.readFileSync(path.join(__dirname, 'airport-codes.json'), 'utf8'));
const icaoCodes = JSON.parse(fs.readFileSync(path.join(__dirname, 'icao-codes.json'), 'utf8'));

class FlightRadar24API {
    constructor() {
        this.baseUrl = 'https://data-cloud.flightradar24.com';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.flightradar24.com',
            'Referer': 'https://www.flightradar24.com/'
        };
    }

    /**
     * Get flights in a bounding box (no authentication required)
     * @param {number} latMin - Minimum latitude
     * @param {number} latMax - Maximum latitude
     * @param {number} lonMin - Minimum longitude
     * @param {number} lonMax - Maximum longitude
     * @returns {Promise<Array>} Array of flight objects
     */
    async getFlightsInBounds(latMin, latMax, lonMin, lonMax) {
        try {
            console.log(`🔍 FlightRadar24: Fetching flights in bounds ${latMin},${lonMin} to ${latMax},${lonMax}`);
            
            // Use the same feed endpoint that FlightRadar24 web uses
            const response = await axios.get(`${this.baseUrl}/zones/fcgi/feed.js`, {
                params: {
                    bounds: `${latMax},${latMin},${lonMin},${lonMax}`,
                    faa: '1',
                    satellite: '1',
                    mlat: '1',
                    flarm: '1',
                    adsb: '1',
                    gnd: '1',
                    air: '1',
                    vehicles: '1',
                    estimated: '1',
                    maxage: '14400',
                    gliders: '1',
                    stats: '1',
                    limit: '5000'
                },
                headers: this.headers,
                timeout: 15000
            });

            if (response.data && response.data.fullcount) {
                console.log(`📊 FlightRadar24 API returned ${response.data.fullcount} aircraft`);
            }

            // Parse the response - FlightRadar24 returns a special format
            const flights = [];
            
            // Process the flight data from the response
            for (const [key, flightData] of Object.entries(response.data)) {
                // Skip non-flight keys (stats, fullcount, etc.)
                if (key === 'fullcount' || key === 'stats') continue;
                
                // FlightRadar24 format: [hex, lat, lng, track, alt, spd, squawk, radar, type, reg, call, origin, dest, flight_num, onground, vspeed, ...]
                if (Array.isArray(flightData) && flightData.length >= 14) {
                    // Use flight number from index 13, fallback to callsign from index 10
                    // Filter out numeric-only identifiers which are typically internal tracking IDs
                    let flightNumber = 'N/A';
                    const rawFlightNum = flightData[13];
                    const rawCallsign = flightData[10];
                    
                    // Prefer flight number if it exists and is not just a numeric ID
                    if (rawFlightNum && rawFlightNum !== '' && !/^\d+$/.test(rawFlightNum)) {
                        flightNumber = rawFlightNum.toString();
                    } 
                    // Use callsign if flight number is not available or is numeric-only
                    else if (rawCallsign && rawCallsign !== '' && !/^\d+$/.test(rawCallsign)) {
                        flightNumber = rawCallsign.toString();
                    }
                    // Fallback to registration if available
                    else if (flightData[9] && flightData[9] !== '') {
                        flightNumber = flightData[9].toString();
                    }
                    // Last resort - use a combination of available data
                    else {
                        flightNumber = 'N/A';
                    }
                    
                    // Get enhanced aircraft type name
                    const aircraftCode = flightData[8] || 'Unknown';
                    const enhancedAircraftType = icaoCodes[aircraftCode] || aircraftCode;
                    
                    // Extract airline code from flight number and classify aircraft type
                    let airlineCode = 'Unknown';
                    let isCargo = false;
                    let isPrivate = false;
                    
                    if (flightNumber && flightNumber !== 'N/A') {
                        // Check for private aircraft (N-numbers)
                        if (flightNumber.startsWith('N') && flightNumber.length > 1) {
                            isPrivate = true;
                            airlineCode = 'N';
                        }
                        // Check for cargo airlines
                        else if (flightNumber.startsWith('UPS') || flightNumber.startsWith('FDX') || 
                                flightNumber.startsWith('GTI') || flightNumber.startsWith('AMZ') ||
                                flightNumber.startsWith('QFA') || flightNumber.startsWith('CKK')) {
                            isCargo = true;
                            // Extract standard airline code
                            const standardMatch = flightNumber.match(/^([A-Z]{2,3})/);
                            if (standardMatch) {
                                airlineCode = standardMatch[1];
                            }
                        }
                        // Standard commercial airlines
                        else {
                            // Standard approach: extract alphabetic prefix (e.g., "UA" from "UA4704")
                            const standardMatch = flightNumber.match(/^([A-Z]{2,3})/);
                            if (standardMatch) {
                                airlineCode = standardMatch[1];
                            } 
                            // Special case for Frontier Airlines (F9)
                            else if (flightNumber.startsWith('F9')) {
                                airlineCode = 'F9';
                            }
                            // Handle other 1-letter prefixes followed by numbers
                            else {
                                const oneLetterMatch = flightNumber.match(/^([A-Z][0-9])/);
                                if (oneLetterMatch) {
                                    airlineCode = oneLetterMatch[1];
                                }
                            }
                        }
                    }
                    
                    // Get enhanced airport names
                    const originCode = flightData[11];
                    const destCode = flightData[12];
                    const originName = originCode ? (airportCodes[originCode] || originCode) : 'Unknown';
                    const destName = destCode ? (airportCodes[destCode] || destCode) : 'Unknown';
                    
                    flights.push({
                        icao24: key,
                        latitude: parseFloat(flightData[1]),
                        longitude: parseFloat(flightData[2]),
                        track: parseFloat(flightData[3]),
                        altitude: parseInt(flightData[4]) || 0,
                        speed: parseInt(flightData[5]) || 0,
                        squawk: flightData[6],
                        radar: flightData[7],
                        aircraft_type: enhancedAircraftType,
                        registration: flightData[9],
                        callsign: flightNumber,
                        time: flightData[11],
                        origin: originCode,
                        destination: destCode,
                        flight_number: flightNumber,
                        airline: airlineCode,
                        is_cargo: isCargo,
                        is_private: isPrivate,
                        on_ground: flightData[14] === 1, // Index 14 indicates if on ground
                        vertical_rate: parseInt(flightData[15]) || 0, // Index 15 is vertical speed
                        position_source: 1, // ADS-B
                        category: 0, // No category in this feed
                        // Add frontend-compatible route fields with enhanced names
                        departure: originName,
                        arrival: destName,
                        route: originCode && destCode && originCode !== '' && destCode !== '' && originCode !== 'Unknown' && destCode !== 'Unknown'
                               ? `${originName} → ${destName}` : 'Local Flight'
                    });
                }
            }
            
            console.log(`✅ Processed ${flights.length} flights from FlightRadar24`);
            return flights;
        } catch (error) {
            console.error('❌ FlightRadar24 API error:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
            }
            return [];
        }
    }

    /**
     * Get detailed flight information by flight ID
     * @param {string} flightId - Flight ID
     * @returns {Promise<Object>} Detailed flight information
     */
    async getFlightDetails(flightId) {
        try {
            console.log(`🔍 FlightRadar24: Fetching details for flight ${flightId}`);
            
            const response = await axios.get(`${this.baseUrl}/clickHandler/index.php`, {
                params: {
                    version: '1.5',
                    planelat: '0',
                    planelong: '0',
                    nav1lat: '0',
                    nav1long: '0',
                    nav2lat: '0',
                    nav2long: '0',
                    zoom: '7'
                },
                headers: this.headers,
                timeout: 10000
            });
            
            return response.data;
        } catch (error) {
            console.error(`❌ FlightRadar24 details error for ${flightId}:`, error.message);
            return null;
        }
    }
}

module.exports = FlightRadar24API;
