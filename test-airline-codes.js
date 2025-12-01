#!/usr/bin/env node

// Test script to verify airline codes functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Airline Codes Test Script');
console.log('============================');

// Load the airline codes
try {
    const airlineCodesPath = path.join(__dirname, 'api', 'airline-codes.json');
    const airlineCodes = JSON.parse(fs.readFileSync(airlineCodesPath, 'utf8'));
    
    console.log(`✅ Successfully loaded ${Object.keys(airlineCodes).length} airline codes`);
    
    // Test specific codes
    const testCodes = ['QF', 'UA', 'AA', 'DL', 'QFA'];
    console.log('\n🔍 Testing specific airline codes:');
    testCodes.forEach(code => {
        const name = airlineCodes[code];
        if (name) {
            console.log(`   ${code} = ${name}`);
        } else {
            console.log(`   ${code} = NOT FOUND`);
        }
    });
    
    // Show some statistics
    console.log('\n📊 Data statistics:');
    console.log(`   Total airline codes: ${Object.keys(airlineCodes).length}`);
    
    // Find codes with "Qantas" in the name
    const qantasCodes = Object.entries(airlineCodes).filter(([code, name]) => 
        name.toLowerCase().includes('qantas')
    );
    console.log(`   Qantas-related codes: ${qantasCodes.length}`);
    qantasCodes.forEach(([code, name]) => {
        console.log(`      ${code} = ${name}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
} catch (error) {
    console.error('❌ Error loading airline codes:', error.message);
    process.exit(1);
}
