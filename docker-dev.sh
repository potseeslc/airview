#!/bin/bash

# Development helper script for Flight Tracker

echo "Flight Tracker Development Helper"
echo "==============================="

echo ""
echo "Available commands:"
echo "  ./docker-dev.sh build    - Build Docker image"
echo "  ./docker-dev.sh run      - Run container"
echo "  ./docker-dev.sh stop     - Stop container"
echo "  ./docker-dev.sh logs     - View logs"
echo "  ./docker-dev.sh clean    - Remove container and image"
echo "  ./docker-dev.sh shell    - Open shell in container"
echo ""

case "${1:-help}" in
    build)
        echo "Building Docker image..."
        docker build -t flight-tracker .
        ;;
    run)
        echo "Starting Flight Tracker..."
        docker run -d \
            --name flight-tracker-dev \
            -p 8080:80 \
            -v $(pwd)/html:/usr/share/nginx/html \
            -v $(pwd)/assets:/usr/share/nginx/html/assets \
            -v $(pwd)/api:/usr/share/nginx/html/api \
            -v $(pwd)/config:/usr/share/nginx/html/config \
            flight-tracker
        echo "App running at http://localhost:8080"
        ;;
    stop)
        echo "Stopping Flight Tracker..."
        docker stop flight-tracker-dev
        ;;
    logs)
        docker logs -f flight-tracker-dev
        ;;
    clean)
        echo "Cleaning up..."
        docker stop flight-tracker-dev 2>/dev/null || true
        docker rm flight-tracker-dev 2>/dev/null || true
        docker rmi flight-tracker 2>/dev/null || true
        echo "Cleanup complete"
        ;;
    shell)
        docker exec -it flight-tracker-dev sh
        ;;
    *)
        echo "Usage: $0 {build|run|stop|logs|clean|shell}"
        ;;
esac
