#!/bin/bash

# Flight Tracker Web App Runner Script

echo "Starting Flight Tracker Web App..."

# Build the Docker image
if [ "$1" = "--build" ] || [ ! -f "flight-tracker.tar" ]; then
    echo "Building Docker image..."
    docker build -t flight-tracker .
    
    # Save image for faster startup next time
    docker save -o flight-tracker.tar flight-tracker
else
    echo "Loading existing Docker image..."
    docker load -i flight-tracker.tar
fi

# Run the container
echo "Starting container on port 8080..."
docker run -d \
    --name flight-tracker-app \
    -p 8080:80 \
    --restart unless-stopped \
    flight-tracker

echo ""
echo "Flight Tracker is now running!"
echo "Access the app at: http://localhost:8080"
echo ""
echo "To stop the app: docker stop flight-tracker-app"
echo "To restart: docker start flight-tracker-app"
echo "To view logs: docker logs flight-tracker-app"
