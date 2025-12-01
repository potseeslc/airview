#!/usr/bin/env node

/**
 * Migration Script: JSON Files to SQLite Database
 * 
 * This script demonstrates how to migrate the current JSON-based data files
 * to a SQLite database for better performance and scalability.
 * 
 * This is NOT required for current operation - it's provided as a future
 * migration path if data size grows or features become more complex.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('🔄 JSON to SQLite Migration Script');
console.log('==================================');
console.log('This script demonstrates a potential migration path to SQLite');
console.log('It is NOT required for current operation\n');

// Function to create database schema
function createSchema(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create airports table
            db.run(`
                CREATE TABLE IF NOT EXISTS airports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    iata_code TEXT UNIQUE,
                    icao_code TEXT UNIQUE,
                    name TEXT,
                    city TEXT,
                    country TEXT,
                    latitude REAL,
                    longitude REAL,
                    timezone TEXT
                )
            `, (err) => {
                if (err) reject(err);
                
                // Create aircraft_types table
                db.run(`
                    CREATE TABLE IF NOT EXISTS aircraft_types (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        icao_code TEXT UNIQUE,
                        iata_code TEXT,
                        manufacturer TEXT,
                        model TEXT,
                        full_name TEXT
                    )
                `, (err) => {
                    if (err) reject(err);
                    
                    // Create airlines table
                    db.run(`
                        CREATE TABLE IF NOT EXISTS airlines (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            iata_code TEXT UNIQUE,
                            icao_code TEXT UNIQUE,
                            name TEXT,
                            country TEXT,
                            callsign TEXT
                        )
                    `, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        });
    });
}

// Function to create indexes for performance
function createIndexes(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code)', (err) => {
                if (err) reject(err);
                else {
                    db.run('CREATE INDEX IF NOT EXISTS idx_aircraft_icao ON aircraft_types(icao_code)', (err) => {
                        if (err) reject(err);
                        else {
                            db.run('CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata_code)', (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    });
                }
            });
        });
    });
}

// Function to populate airports table
function populateAirports(db, airportData) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO airports (iata_code, name) 
            VALUES (?, ?)
        `);
        
        let count = 0;
        for (const [iataCode, cityName] of Object.entries(airportData)) {
            if (iataCode && iataCode.length === 3) {
                stmt.run([iataCode, cityName], (err) => {
                    if (err) {
                        console.error('Error inserting airport:', iataCode, err.message);
                    } else {
                        count++;
                    }
                });
            }
        }
        
        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`✅ Imported ${count} airports`);
                resolve();
            }
        });
    });
}

// Function to populate aircraft types table
function populateAircraftTypes(db, aircraftData) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO aircraft_types (icao_code, full_name) 
            VALUES (?, ?)
        `);
        
        let count = 0;
        for (const [icaoCode, fullName] of Object.entries(aircraftData)) {
            if (icaoCode) {
                stmt.run([icaoCode, fullName], (err) => {
                    if (err) {
                        console.error('Error inserting aircraft type:', icaoCode, err.message);
                    } else {
                        count++;
                    }
                });
            }
        }
        
        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`✅ Imported ${count} aircraft types`);
                resolve();
            }
        });
    });
}

// Function to populate airlines table
function populateAirlines(db, airlineData) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO airlines (iata_code, name) 
            VALUES (?, ?)
        `);
        
        let count = 0;
        for (const [iataCode, fullName] of Object.entries(airlineData)) {
            // Only insert main codes, not IATA variations
            if (iataCode && iataCode.length <= 3 && iataCode === iataCode.toUpperCase()) {
                stmt.run([iataCode, fullName], (err) => {
                    if (err) {
                        // Only log for primary codes
                        if (iataCode.length <= 2) {
                            console.error('Error inserting airline:', iataCode, err.message);
                        }
                    } else {
                        count++;
                    }
                });
            }
        }
        
        stmt.finalize((err) => {
            if (err) reject(err);
            else {
                console.log(`✅ Imported ${count} airlines`);
                resolve();
            }
        });
    });
}

// Sample function showing how data would be queried from SQLite
function demonstrateQueries(db) {
    return new Promise((resolve, reject) => {
        console.log('\n🔍 Sample Queries (Post-Migration):');
        
        // Example: Get airport name by IATA code
        db.get('SELECT name FROM airports WHERE iata_code = ?', ['DEN'], (err, row) => {
            if (err) {
                console.error('Query error:', err.message);
            } else {
                console.log(`   Airport DEN: ${row ? row.name : 'Not found'}`);
            }
            
            // Example: Get aircraft type by ICAO code
            db.get('SELECT full_name FROM aircraft_types WHERE icao_code = ?', ['F900'], (err, row) => {
                if (err) {
                    console.error('Query error:', err.message);
                } else {
                    console.log(`   Aircraft F900: ${row ? row.full_name : 'Not found'}`);
                }
                
                // Example: Get airline by IATA code
                db.get('SELECT name FROM airlines WHERE iata_code = ?', ['QF'], (err, row) => {
                    if (err) {
                        console.error('Query error:', err.message);
                    } else {
                        console.log(`   Airline QF: ${row ? row.name : 'Not found'}`);
                    }
                    resolve();
                });
            });
        });
    });
}

// Main migration function
async function migrateData() {
    console.log('🚀 Starting Migration Analysis...\n');
    
    try {
        // Load JSON data
        console.log('📂 Loading current JSON data...');
        const airportData = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'airport-codes.json'), 'utf8'));
        const aircraftData = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'icao-codes.json'), 'utf8'));
        const airlineData = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'airline-codes.json'), 'utf8'));
        
        console.log(`   Airports: ${Object.keys(airportData).length}`);
        console.log(`   Aircraft: ${Object.keys(aircraftData).length}`);
        console.log(`   Airlines: ${Object.keys(airlineData).length}\n`);
        
        // In a real migration, we would:
        // 1. Create SQLite database
        // const db = new sqlite3.Database(path.join(__dirname, 'flight-data.db'));
        // 
        // 2. Create schema
        // await createSchema(db);
        // 
        // 3. Populate tables
        // await populateAirports(db, airportData);
        // await populateAircraftTypes(db, aircraftData);
        // await populateAirlines(db, airlineData);
        // 
        // 4. Create indexes
        // await createIndexes(db);
        // 
        // 5. Demonstrate queries
        // await demonstrateQueries(db);
        // 
        // 6. Close database
        // db.close();
        
        console.log('📋 Migration Analysis Complete');
        console.log('==============================');
        console.log('✅ JSON files are currently appropriate for your data size');
        console.log('✅ Migration to SQLite would offer performance benefits if needed');
        console.log('✅ Schema design ready for future implementation');
        console.log('\n📊 When to consider SQLite:');
        console.log('   • Data exceeds 1-2MB');
        console.log('   • Need complex queries (e.g., geographic searches)');
        console.log('   • Require concurrent access');
        console.log('   • Add user data or preferences');
        console.log('\n🔧 To implement SQLite migration:');
        console.log('   1. Install: npm install sqlite3');
        console.log('   2. Uncomment migration code in this script');
        console.log('   3. Update backend to use SQLite instead of JSON');
        console.log('   4. Modify update scripts to work with database');
        
    } catch (error) {
        console.error('❌ Migration analysis failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    migrateData();
}

module.exports = { 
    createSchema, 
    createIndexes, 
    populateAirports, 
    populateAircraftTypes, 
    populateAirlines,
    demonstrateQueries
};
