#!/usr/bin/env python3
"""
Test script to verify OpenSky API integration
"""

import sys
import json
from opensky_api import OpenSkyApi

def test_opensky_connection():
    """Test basic OpenSky API connection"""
    try:
        print("🔍 Testing OpenSky API connection...")
        
        # Create API client (anonymous)
        api = OpenSkyApi()
        
        # Test getting states for a small area around Denver
        lat, lon = 39.8121035, -105.1125547  # Arvada, Colorado
        radius_km = 50
        
        # Calculate bounding box
        lat_delta = radius_km / 111.0
        lon_delta = radius_km / (111.0 * abs(__import__('math').cos(__import__('math').radians(lat))))
        
        bbox = {
            'lamin': lat - lat_delta,
            'lamax': lat + lat_delta,
            'lomin': lon - lon_delta,
            'lomax': lon + lon_delta
        }
        
        print(f"🔍 Fetching flights in bounding box: {bbox}")
        
        # Fetch states within bounding box
        states = api.get_states(bbox=(bbox['lamin'], bbox['lamax'], bbox['lomin'], bbox['lomax']))
        
        if not states or not states.states:
            print("⚠️ No flight states returned from OpenSky")
            return False
        
        print(f"✅ OpenSky API returned {len(states.states)} aircraft states")
        
        # Show details of first few flights
        for i, state in enumerate(states.states[:3]):
            if state and not state.on_ground and state.latitude and state.longitude:
                print(f"  Flight {i+1}: {state.callsign or 'N/A'} ({state.icao24})")
                print(f"    Position: {state.latitude}, {state.longitude}")
                print(f"    Altitude: {state.baro_altitude * 3.28084 if state.baro_altitude else 0:.0f} ft")
                print(f"    Velocity: {state.velocity * 1.94384 if state.velocity else 0:.0f} kts")
                print(f"    Category: {getattr(state, 'category', 0) if hasattr(state, 'category') else 0}")
                print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing OpenSky connection: {e}")
        return False

def test_python_enhancer():
    """Test the Python flight enhancer service"""
    try:
        print("🔧 Testing Python flight enhancer service...")
        
        # Import our enhancer module
        import importlib.util
        import sys
        
        spec = importlib.util.spec_from_file_location(
            "python_flight_enhancer", 
            "/Users/colterwilson/Documents/Flight 24 Airline Card/api/python-flight-enhancer.py"
        )
        enhancer_module = importlib.util.module_from_spec(spec)
        sys.modules["python_flight_enhancer"] = enhancer_module
        spec.loader.exec_module(enhancer_module)
        
        # Test the aircraft category function
        test_categories = [0, 2, 4, 6, 14]
        print("  Aircraft category mappings:")
        for cat in test_categories:
            desc = enhancer_module.get_aircraft_category_description(cat)
            print(f"    Category {cat}: {desc}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Python enhancer: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Flight Tracker - OpenSky API Integration Test")
    print("=" * 50)
    
    # Test OpenSky connection
    opensky_success = test_opensky_connection()
    
    print()
    
    # Test Python enhancer
    enhancer_success = test_python_enhancer()
    
    print()
    print("=" * 50)
    if opensky_success and enhancer_success:
        print("✅ All tests passed! OpenSky integration is working correctly.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the error messages above.")
        sys.exit(1)
