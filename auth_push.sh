#!/bin/bash

# Script to securely authenticate and push to GitHub

echo "=== GitHub Authentication for Airview ==="
echo ""
echo "Steps to create a Personal Access Token:"
echo "1. Visit: https://github.com/settings/tokens"
echo "2. Click 'Generate new token' → 'Generate new token (classic)'"
echo "3. Give it a name like 'Airview Push'"
echo "4. Set expiration (e.g., 90 days)"
echo "5. Select scope: check 'repo' (full control of repositories)"
echo "6. Click 'Generate token'"
echo "7. COPY the token (you won't see it again)"
echo ""

read -p "Press Enter after creating your token..."

# Use git credential helper to store credentials
echo ""
echo "Configuring Git credentials..."
cd /Users/colterwilson/Documents/airview

# Set up credential helper
git config --global credential.helper osxkeychain

# Try to push, which will prompt for username and token
echo ""
echo "Attempting to push to GitHub..."
echo "When prompted:"
echo "- Username: your GitHub username (potseeslc)"
echo "- Password: your Personal Access Token (paste it)"
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "✅ Your credentials are now stored in macOS Keychain"
    echo "✅ Future Git operations will use stored credentials"
    
    # Also push the tag
    echo ""
    echo "Pushing tag v1.0.0..."
    git push origin v1.0.0
    
    echo ""
    echo "🎉 All done! Your repository is now published."
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "  - Your Personal Access Token has 'repo' permissions"
    echo "  - You have write access to the potseeslc/airview repository"
    echo "  - The repository exists at https://github.com/potseeslc/airview"
fi
