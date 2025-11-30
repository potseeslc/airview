# Airview - Flight Tracking Web App

Airview is a Docker-based web application that displays flight information in a clean, modern interface using the FlightRadar24 API. Inspired by Home Assistant flight tracking cards, Airview provides a standalone solution for displaying nearby flights on any device.

## Features

- Real-time flight tracking via FlightRadar24 API (no authentication required)
- Displays flights within a specified radius of your location
- Responsive design for kiosk/screen display
- Auto-refresh with configurable interval
- Aircraft type information with full descriptive names
- Departure and arrival city information for flights
- Admin panel for configuration
- Docker container for easy deployment

## Quick Start

1. Build the container: `docker-compose up --build`
2. Open browser to `http://localhost:3000`
3. Configure your location in the admin panel at `http://localhost:3000/admin`

## Project Structure

- `backend/` - Node.js Express server with API endpoints
- `html/` - Main web page files for flight display
- `admin/` - Admin panel for configuration
- `api/` - JavaScript API handlers
- `assets/` - Images and logos for airlines
- `config/` - Configuration files

## API Integration

- **Primary**: FlightRadar24 API (public, no authentication required)
- **Enhancement**: Built-in aircraft type and route enhancement
- **Fallback**: Sample data with realistic routes and aircraft types

## Requirements

- Docker
- Docker Compose

## Deployment

1. Clone the repository
2. Configure your location in the `config.json` file or use the admin panel
3. Run with Docker: `docker-compose up -d`
4. Access the application at `http://localhost:3000`

## Configuration

The application can be configured either through the admin panel or by editing the `config.json` file:

```json
{
  "home": {
    "latitude": 39.8121035,
    "longitude": -105.1125547,
    "radius": 75,
    "minAltitude": 10000,
    "maxAltitude": 45000
  },
  "settings": {
    "refreshInterval": 30000
  }
}
```

## License

MIT License - see LICENSE file for details.
