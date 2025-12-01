# Flight Tracker Data Sources

This document describes the data sources used for aircraft and airport code mappings in the Flight Tracker application.

## Aircraft Type Codes (ICAO)

### Source
- **OpenFlights Database**: https://github.com/jpatokal/openflights/blob/master/data/planes.dat
- **Format**: CSV with columns: Full Name, IATA Code, ICAO Code
- **Entries**: ~240+ aircraft types

### Update Process
The `update-data-sources.js` script automatically downloads and updates this data:

```bash
node update-data-sources.js
```

### Examples
| ICAO Code | Full Name |
|-----------|-----------|
| F900 | Dassault Falcon 900 |
| B738 | Boeing 737-800 |
| A320 | Airbus A320 |
| A21N | Airbus A321neo |

### Integration
The data is stored in `api/icao-codes.json` and loaded by the frontend JavaScript to enhance aircraft type display.

## Airport Codes (IATA)

### Source
- **Airport Codes Dataset**: https://github.com/datasets/airport-codes
- **Format**: CSV with ~80,000+ airports
- **Entries**: ~8,500+ IATA codes with city names

### Update Process
The `update-data-sources.js` script automatically downloads and updates this data:

```bash
node update-data-sources.js
```

### Examples
| IATA Code | City |
|-----------|------|
| DEN | Denver |
| EGE | Eagle |
| AUS | Austin |
| SFO | San Francisco |

### Integration
The data is stored in `api/airport-codes.json` and used by the backend FlightRadar24 integration to enhance airport names in routes.

## Airline Codes (IATA/ICAO)

### Source
- **Comprehensive Airline Database**: Custom compiled from multiple sources
- **Format**: JSON with airline code to full name mappings
- **Entries**: ~400+ airline codes with full names

### Update Process
The data is manually maintained in `api/airline-codes.json`:

```bash
# The data is stored directly in the JSON file
cat api/airline-codes.json
```

### Examples
| Airline Code | Full Name |
|--------------|-----------|
| QF | Qantas |
| UA | United Airlines |
| AA | American Airlines |
| DL | Delta Air Lines |

### Integration
The data is stored in `api/airline-codes.json` and used by both the backend and frontend to enhance airline names in flight displays.

## Testing

### Test Files
1. `icao-test.html` - Test ICAO code mappings in browser
2. `f900-demo.html` - Demonstrate the F900 enhancement
3. `aircraft-code-test.html` - Comprehensive aircraft code testing
4. `test-icao-mapping.js` - Backend ICAO code verification

### Docker Container
The application runs in Docker and automatically uses the updated data sources:

```bash
docker-compose up -d
```

## Enhancement Implementation

### Backend (Node.js)
The `api/flightradar24-integration.js` module:
1. Loads `icao-codes.json` and `airport-codes.json` at startup
2. Enhances raw FlightRadar24 data with full aircraft names
3. Maps airport codes to city names for routes

### Frontend (JavaScript)
The `api/flight-data-integrated.js` module:
1. Dynamically loads `icao-codes.json` when the page loads
2. Maps aircraft type codes to full names for display
3. Improves user experience with detailed aircraft information

## Future Improvements

### Automated Updates
Consider setting up a cron job to automatically update data sources weekly:

```bash
# Weekly update (Sunday at 2 AM)
0 2 * * 0 cd /path/to/flight-tracker && node update-data-sources.js && docker-compose restart
```

### Data Validation
Implement validation to ensure data quality:
- Check for duplicate entries
- Validate ICAO/IATA code formats
- Remove outdated or deprecated aircraft types

### Additional Sources
- **OurAirports**: https://ourairports.com/data/ for more comprehensive airport data
- **IATA Master Codes**: Official IATA code database (commercial)

## Troubleshooting

### Missing Aircraft Types
If an aircraft type is not displayed correctly:
1. Check `api/icao-codes.json` for the ICAO code
2. Run `node test-icao-mapping.js` to verify mappings
3. Update data sources if needed

### Missing Airport Names
If airport codes show as codes instead of names:
1. Check `api/airport-codes.json` for the IATA code
2. Verify the IATA code is 3 characters
3. Update data sources if needed

### Docker Issues
If changes aren't reflected in the application:
1. Restart the Docker container: `docker-compose restart`
2. Rebuild if necessary: `docker-compose down && docker-compose up -d --build`
