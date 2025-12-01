#!/bin/bash

echo "Please create a Personal Access Token at: https://github.com/settings/tokens"
echo "Select 'repo' scope permissions"
echo ""
read -p "Enter your GitHub Personal Access Token: " token

# Set the remote URL with token
cd /Users/colterwilson/Documents/airview
git remote set-url origin https://potseeslc:$token@github.com/potseeslc/airview.git

echo "Pushing to GitHub..."
git push origin main

# After pushing, reset to a more secure URL
git remote set-url origin https://github.com/potseeslc/airview.git

echo "Done! Your credentials are now stored in the macOS Keychain."
