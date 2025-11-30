// Test script to verify ICAO code mappings
const fs = require('fs');
const path = require('path');

// Load the ICAO codes mapping
const icaoCodesPath = path.join(__dirname, 'api', 'icao-codes.json');
const icaoCodes = JSON.parse(fs.readFileSync(icaoCodesPath, 'utf8'));

console.log('=== ICAO Code Mapping Verification ===');
console.log(`Total aircraft codes in mapping: ${Object.keys(icaoCodes).length}`);

// Test specific codes
const testCodes = ['F900', 'B738', 'A320', 'A21N', 'B789'];

console.log('\n=== Testing Specific Aircraft Codes ===');
testCodes.forEach(code => {
  if (icaoCodes[code]) {
    console.log(`✓ ${code}: ${icaoCodes[code]}`);
  } else {
    console.log(`✗ ${code}: NOT FOUND`);
  }
});

// Check if F900 is properly mapped
console.log('\n=== F900 Verification ===');
if (icaoCodes['F900']) {
  console.log(`✓ F900 is mapped to: ${icaoCodes['F900']}`);
} else {
  console.log('✗ F900 is NOT in the mapping');
}

// Count how many codes start with certain prefixes
const prefixes = ['A', 'B', 'F', 'C', 'D', 'E', 'G', 'H'];
console.log('\n=== Code Distribution by Prefix ===');
prefixes.forEach(prefix => {
  const count = Object.keys(icaoCodes).filter(code => code.startsWith(prefix)).length;
  console.log(`${prefix}*: ${count} codes`);
});

// Show some examples of private aircraft and cargo planes
console.log('\n=== Special Aircraft Types ===');

// Find private jets
const privateJets = Object.keys(icaoCodes).filter(code => 
  icaoCodes[code].toLowerCase().includes('private') || 
  icaoCodes[code].toLowerCase().includes('jet') ||
  icaoCodes[code].toLowerCase().includes('falcon') ||
  icaoCodes[code].toLowerCase().includes('gulfstream')
).slice(0, 10);

console.log('Private/Cargo aircraft examples:');
privateJets.forEach(code => {
  console.log(`  ${code}: ${icaoCodes[code]}`);
});
