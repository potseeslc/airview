#!/bin/bash

# Kiosk Mode Setup Script for Flight Tracker

echo Setting up Flight Tracker in Kiosk Mode...

# Check if we're running on a system with display capabilities
if [ -z "$DISPLAY" ]; then
    echo "Warning: No display detected. Kiosk mode may not work properly."
    echo "This script is designed for systems with a graphical display."
fi

# Install dependencies for kiosk mode (if needed)
if command -v apt-get \> /dev/null 2\>\&1; then
    # Ubuntu/Debian
    sudo apt-get update
    sudo apt-get install -y chromium-browser unclutter
elif command -v yum \> /dev/null 2\>\&1; then
    # CentOS/RHEL
    sudo yum install -y chromium unclutter
fi

# Create kiosk startup script
cat \> start-kiosk.sh \<\< 'ENDSCRIPT'
#!/bin/bash

# Hide cursor
unclutter -idle 0.5 -root \&\n\n# Disable screen saver and power management
xset s off
xset -dpms
xset s noblank\n\n# Start browser in kiosk mode
chromium-browser --kiosk --disable-infobars --disable-features=TranslateUI \\n    --no-first-run --disable-web-security --user-data-dir=/tmp/chromium-profile \\n    http://localhost:8080
ENDSCRIPT

chmod +x start-kiosk.sh

echo ""
echo "Kiosk setup complete!"
echo ""
echo "To start the kiosk:"
echo "1. First run the flight tracker: ./run.sh"
echo "2. Then start kiosk mode: ./start-kiosk.sh"
echo ""
echo "The browser will open in full-screen kiosk mode on port 8080"
