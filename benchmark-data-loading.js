#!/usr/bin/env node

/**
 * Benchmark Script: Data Loading Performance
 * 
 * This script measures the performance of loading JSON data files
 * to help monitor when migration to a database might be needed.
 */

const fs = require('fs');
const path = require('path');

console.log('⏱️  Data Loading Performance Benchmark');
console.log('======================================');

function benchmarkFileLoad(filePath, description) {
    const startTime = process.hrtime.bigint();
    
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const endTime = process.hrtime.bigint();
        const loadTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        const fileSize = fs.statSync(filePath).size;
        
        console.log(`✅ ${description}:`);
        console.log(`   File Size: ${(fileSize / 1024).toFixed(1)}KB`);
        console.log(`   Load Time: ${loadTime.toFixed(2)}ms`);
        console.log(`   Entries: ${Object.keys(data).length}`);
        console.log(`   Performance: ${(fileSize / loadTime).toFixed(2)} KB/ms\n`);
        
        return { loadTime, fileSize, entries: Object.keys(data).length };
    } catch (error) {
        console.error(`❌ ${description}: ${error.message}\n`);
        return null;
    }
}

function benchmarkLookup(data, key, description) {
    const startTime = process.hrtime.bigint();
    
    const value = data[key];
    
    const endTime = process.hrtime.bigint();
    const lookupTime = Number(endTime - startTime) / 1000; // Convert to microseconds
    
    console.log(`✅ ${description}:`);
    console.log(`   Lookup Time: ${lookupTime.toFixed(2)}μs`);
    console.log(`   Result: ${value || 'Not found'}\n`);
    
    return lookupTime;
}

function runBenchmarks() {
    console.log('🚀 Running Data Loading Benchmarks...\n');
    
    // Benchmark data loading
    const apiDir = path.join(__dirname, 'api');
    
    const aircraftResult = benchmarkFileLoad(
        path.join(apiDir, 'icao-codes.json'),
        'Aircraft Types'
    );
    
    const airportResult = benchmarkFileLoad(
        path.join(apiDir, 'airport-codes.json'),
        'Airport Codes'
    );
    
    const airlineResult = benchmarkFileLoad(
        path.join(apiDir, 'airline-codes.json'),
        'Airline Codes'
    );
    
    // Calculate totals
    if (aircraftResult && airportResult && airlineResult) {
        const totalSize = aircraftResult.fileSize + airportResult.fileSize + airlineResult.fileSize;
        const totalTime = aircraftResult.loadTime + airportResult.loadTime + airlineResult.loadTime;
        
        console.log('📊 Totals:');
        console.log(`   Total Data Size: ${(totalSize / 1024).toFixed(1)}KB`);
        console.log(`   Total Load Time: ${totalTime.toFixed(2)}ms`);
        console.log(`   Combined Entries: ${aircraftResult.entries + airportResult.entries + airlineResult.entries}`);
        
        // Performance thresholds
        console.log('\n🎯 Performance Thresholds:');
        console.log(`   File Size Limit: 1MB (Current: ${(totalSize / 1024).toFixed(1)}KB)`);
        console.log(`   Load Time Limit: 50ms (Current: ${totalTime.toFixed(2)}ms)`);
        console.log(`   Performance Ratio: ${(totalSize / totalTime).toFixed(2)} KB/ms`);
        
        if (totalSize > 1024 * 1024) {
            console.log('\n⚠️  WARNING: Data size exceeds 1MB - consider database migration');
        }
        
        if (totalTime > 50) {
            console.log('\n⚠️  WARNING: Load time exceeds 50ms - consider database migration');
        }
    }
    
    // Benchmark specific lookups
    console.log('\n🔍 Lookup Performance Tests:');
    
    // Load data for lookups
    try {
        const aircraftData = JSON.parse(fs.readFileSync(path.join(apiDir, 'icao-codes.json'), 'utf8'));
        const airportData = JSON.parse(fs.readFileSync(path.join(apiDir, 'airport-codes.json'), 'utf8'));
        const airlineData = JSON.parse(fs.readFileSync(path.join(apiDir, 'airline-codes.json'), 'utf8'));
        
        benchmarkLookup(aircraftData, 'F900', 'Aircraft Type Lookup (F900)');
        benchmarkLookup(airportData, 'DEN', 'Airport Lookup (DEN)');
        benchmarkLookup(airlineData, 'QF', 'Airline Lookup (QF)');
        
    } catch (error) {
        console.error(`❌ Lookup benchmark failed: ${error.message}`);
    }
    
    console.log('\n✅ Benchmark Complete');
    console.log('\n📋 Recommendations:');
    console.log('   • Monitor these metrics monthly');
    console.log('   • Consider SQLite when total size > 1MB');
    console.log('   • Consider SQLite when load time > 50ms');
    console.log('   • Database migration tools are available in migrate-to-sqlite.js');
}

// Run if called directly
if (require.main === module) {
    runBenchmarks();
}

module.exports = { benchmarkFileLoad, benchmarkLookup, runBenchmarks };
