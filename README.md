# Airview - Flight Tracking Web App

[![Docker Pulls](https://img.shields.io/docker/pulls/potseeslc/airview)](https://hub.docker.com/r/potseeslc/airview)
[![GitHub stars](https://img.shields.io/github/stars/potseeslc/airview)](https://github.com/potseeslc/airview/stargazers)
[![License](https://img.shields.io/github/license/potseeslc/airview)](https://github.com/potseeslc/airview/blob/main/LICENSE)

Airview is a Docker-based web application that displays flight information in a clean, modern interface using the FlightRadar24 API. Inspired by Home Assistant flight tracking cards, Airview provides a standalone solution for displaying nearby flights on any device.

## Features

- 🛫 **Real-time flight tracking** via FlightRadar24 API (no authentication required)
- 📍 **Location-based filtering** - displays flights within a specified radius of your location
- 📱 **Responsive design** for kiosk/screen display
- ⚙️ **Auto-refresh** with configurable interval
- ✈️ **Aircraft information** with full descriptive names (e.g., "Boeing 737-800" instead of "B738")
- 🌍 **Airport information** with city names (e.g., "Denver → Los Angeles" instead of "DEN → LAX")
- 🛩️ **Airline information** with full names (e.g., "Qantas" instead of "QF")
- 🛠️ **Admin panel** for easy configuration
- 🐳 **Docker container** for easy deployment
- 🧪 **Fallback mode** with sample data when API is unavailable

## Quick Start

### Using Docker (Simplest Option)

```bash
# Run the container with default settings (Empire State Building location)
docker run -d \
  --name airview \
  -p 3000:3000 \
  potseeslc/airview:latest
```

Access the application at `http://localhost:3000`

### Using Docker (With Custom Configuration)

If you want to use a custom location, create a `config.json` file first:

```bash
# Create a basic config file
echo '{
  "home": {
    "latitude": 40.7484405,
    "longitude": -73.9856644,
    "radius": 75,
    "minAltitude": 10000,
    "maxAltitude": 45000
  },
  "settings": {
    "refreshInterval": 60000
  }
}' > config.json
```

Then run the container with the config file:

```bash
docker run -d \
  --name airview \
  -p 3000:3000 \
  -v ./config.json:/app/backend/config.json \
  potseeslc/airview:latest
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  airview:
    image: potseeslc/airview:latest
    ports:
      - "3000:3000"
    volumes:
      - ./config.json:/app/backend/config.json
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

### Configuration

The default location is set to the Empire State Building in New York City:
- Latitude: 40.7484405
- Longitude: -73.9856644

You can change this through the admin panel at `http://localhost:3000/admin` or by modifying the config.json file.

## Project Structure

- `backend/` - Node.js Express server with API endpoints
- `html/` - Main web page files for flight display
- `admin/` - Admin panel for configuration
- `api/` - JavaScript API handlers and data enhancement files
- `assets/` - Images and logos for airlines

## API Integration

- **Primary**: FlightRadar24 API (public, no authentication required)
- **Enhancement**: Built-in aircraft type, airline names, and route enhancement
- **Data Sources**: 
  - ICAO aircraft codes (~246 types)
  - IATA airport codes (~8,554 airports)
  - IATA airline codes (~413 airlines)
- **Data Architecture**: JSON files optimized for current scale (data < 1MB)
- **Fallback**: Sample data with realistic routes and aircraft types

## Data Architecture

Airview uses a lightweight JSON-based data architecture optimized for its current scale:
- **Total Data Size**: ~228KB (well under 1MB performance limit)
- **Loading Performance**: Under 10ms total load time
- **Lookup Performance**: Microsecond response times
- **Deployment**: Simple with no database dependencies
- **Scalability**: Ready migration path to SQLite when needed
- **Monitoring**: Built-in benchmarking with `npm run benchmark`

For more details on data architecture decisions, see:
- [DATA_ARCHITECTURE_ANALYSIS.md](DATA_ARCHITECTURE_ANALYSIS.md) - Performance comparison
- [DATA_ARCHITECTURE_DECISION.md](DATA_ARCHITECTURE_DECISION.md) - Decision framework
- [migrate-to-sqlite.js](migrate-to-sqlite.js) - Migration templates

## Requirements

- Docker (for containerized deployment)
- Docker Compose (optional, for easier setup)

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/potseeslc/airview.git
   cd airview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your location in the `backend/config.json` file

4. Run the server:
   ```bash
   npm start
   ```

5. Visit `http://localhost:3000`

## Maintenance

- **Update data sources**: `node update-data-sources.js` (monthly recommended)
- **Verify setup**: `node verify-complete-setup.js`
- **Performance benchmark**: `npm run benchmark`
- **Test airline codes**: `node test-airline-codes.js`
- **Apply updates**: `docker-compose restart`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
