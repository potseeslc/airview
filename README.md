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
- 🛠️ **Admin panel** for easy configuration
- 🐳 **Docker container** for easy deployment
- 🧪 **Fallback mode** with sample data when API is unavailable

## Quick Start

### Using Docker (Recommended)

```bash
# Pull the image from Docker Hub
docker pull potseeslc/airview

# Run the container
docker run -d \
  --name airview \
  -p 8080:80 \
  -v ./config.json:/app/backend/config.json \
  potseeslc/airview
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  airview:
    image: potseeslc/airview
    ports:
      - "8080:80"
    volumes:
      - ./config.json:/app/backend/config.json
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

### Configuration

Create a `config.json` file:

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

Access the application at `http://localhost:8080`

## Project Structure

- `backend/` - Node.js Express server with API endpoints
- `html/` - Main web page files for flight display
- `admin/` - Admin panel for configuration
- `api/` - JavaScript API handlers
- `assets/` - Images and logos for airlines

## API Integration

- **Primary**: FlightRadar24 API (public, no authentication required)
- **Enhancement**: Built-in aircraft type and route enhancement
- **Fallback**: Sample data with realistic routes and aircraft types

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

5. Visit `http://localhost:8080`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
