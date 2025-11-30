# Flight Tracker - Departure/Arrival Enhancement

## Overview

This enhancement adds departure and arrival city information to your flight tracking application. The system infers route information based on airline codes and flight numbers using a database of common airline routes.

## Features Added

1. **Route Enhancement Service** - A new Python service that adds departure/arrival information
2. **Airport-to-City Mapping** - Converts airport codes to readable city names
3. **Multiple API Layer Approach** - Falls back gracefully if primary data source fails

## How It Works

1. When flight data is retrieved from OpenSky, it includes callsign information (e.g., "UAL2745")
2. The system extracts the airline code ("UA" for United Airlines)
3. Based on the airline and your location (DEN), it determines common routes
4. The departure and arrival airports are converted to readable city names
5. This information is displayed in the frontend

## Example Output

Before enhancement:
```json
{
  "callsign": "UAL2745",
  "icao24": "a5d1b9",
  "altitude": 35000,
  "speed": 475
}
```

After enhancement:
```json
{
  "callsign": "UAL2745",
  "icao24": "a5d1b9",
  "altitude": 35000,
  "speed": 475,
  "departure_airport": "DEN",
  "arrival_airport": "SFO",
  "departure_city": "Denver, CO",
  "arrival_city": "San Francisco, CA",
  "route": "DEN → SFO"
}
```

## API Integration

The enhancement uses a layered approach:

1. **Primary Source**: OpenSky Network API (authenticated)
2. **Secondary Enhancement**: Python-based route inference
3. **Fallback**: Sample data with realistic routes

## Configuration

The system uses your existing OpenSky credentials for authentication. No additional configuration is required for basic operation.

## Future Improvements

For a production system, you might consider integrating with commercial APIs such as:

1. **FlightAware API** - Comprehensive flight data with routes
2. **Amadeus Flight API** - Global flight information
3. **AviationStack API** - Real-time flight status with airport information
4. **IATA Airline Codes Database** - Airport codes to city name mapping

These would require API keys but would provide more accurate and comprehensive route data.

## Files Added/Modified

- `api/route-enhancer.py` - New service for route enhancement
- `requirements.txt` - Added requests library dependency
- `backend/server.js` - Updated to call route enhancement service
- `Dockerfile` - Updated to install new Python requirements

## Testing the Enhancement

To test the new functionality:

1. Ensure your Docker container is running
2. Visit http://localhost:3000/
3. Live flights should now show departure and arrival information
4. You can check the server logs to see the enhancement process

## Error Handling

If the route enhancement service fails, the system will:
1. Log the error to the console
2. Continue with the original flight data
3. Not display route information (fields will be missing)

This ensures that the flight tracking functionality remains operational even if the enhancement service encounters issues.
