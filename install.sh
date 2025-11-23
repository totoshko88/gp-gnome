#!/bin/bash

# GNOME GlobalProtect Extension Installation Script
# This script installs the extension to the user's GNOME extensions directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Extension UUID
EXTENSION_UUID="globalprotect@username.github.io"

# Installation directory
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "=========================================="
echo "GNOME GlobalProtect Extension Installer"
echo "=========================================="
echo ""

# Check if GNOME Shell is installed
if ! command -v gnome-shell &> /dev/null; then
    echo -e "${RED}Error: GNOME Shell is not installed${NC}"
    exit 1
fi

# Get GNOME Shell version
GNOME_VERSION=$(gnome-shell --version | grep -oP '\d+' | head -1)
echo -e "Detected GNOME Shell version: ${GREEN}$GNOME_VERSION${NC}"

# Check if GlobalProtect CLI is installed
if ! command -v globalprotect &> /dev/null; then
    echo -e "${YELLOW}Warning: GlobalProtect CLI is not installed${NC}"
    echo "The extension requires GlobalProtect CLI to function."
    echo "Please install it before using the extension."
    echo ""
fi

# Create installation directory if it doesn't exist
echo "Creating installation directory..."
mkdir -p "$INSTALL_DIR"

# Copy extension files
echo "Copying extension files..."
cp -r extension.js prefs.js indicator.js gpClient.js statusMonitor.js errorHandler.js "$INSTALL_DIR/"
cp metadata.json stylesheet.css "$INSTALL_DIR/"

# Copy schemas
echo "Copying GSettings schema..."
mkdir -p "$INSTALL_DIR/schemas"
cp schemas/org.gnome.shell.extensions.globalprotect.gschema.xml "$INSTALL_DIR/schemas/"

# Copy icons
echo "Copying icons..."
mkdir -p "$INSTALL_DIR/icons"
cp icons/*.png "$INSTALL_DIR/icons/"

# Compile schemas
echo "Compiling GSettings schema..."
if ! glib-compile-schemas "$INSTALL_DIR/schemas/"; then
    echo -e "${RED}Error: Failed to compile GSettings schema${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Extension files installed successfully${NC}"
echo ""

# Check if extension is already enabled
if gnome-extensions list --enabled | grep -q "$EXTENSION_UUID"; then
    echo -e "${YELLOW}Extension is already enabled${NC}"
    echo "Restarting GNOME Shell is recommended to apply changes."
else
    # Enable the extension
    echo "Enabling extension..."
    if gnome-extensions enable "$EXTENSION_UUID"; then
        echo -e "${GREEN}✓ Extension enabled successfully${NC}"
    else
        echo -e "${YELLOW}Warning: Could not enable extension automatically${NC}"
        echo "You can enable it manually using:"
        echo "  gnome-extensions enable $EXTENSION_UUID"
    fi
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart GNOME Shell:"
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    echo "   - Press Alt+F2, type 'r', press Enter"
else
    echo "   - Log out and log back in (Wayland)"
fi
echo ""
echo "2. Configure the extension:"
echo "   - Click the GlobalProtect icon in the system tray"
echo "   - Click 'Settings'"
echo "   - Enter your VPN portal address"
echo ""
echo "3. Connect to VPN:"
echo "   - Click the GlobalProtect icon"
echo "   - Click 'Connect'"
echo ""
echo "For troubleshooting, see README.md"
echo ""
