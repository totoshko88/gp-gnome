#!/bin/bash

# GNOME GlobalProtect Extension Uninstallation Script
# This script removes the extension from the user's GNOME extensions directory

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
echo "GNOME GlobalProtect Extension Uninstaller"
echo "=========================================="
echo ""

# Check if extension is installed
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Extension is not installed${NC}"
    exit 0
fi

# Disable the extension if it's enabled
if gnome-extensions list --enabled | grep -q "$EXTENSION_UUID"; then
    echo "Disabling extension..."
    if gnome-extensions disable "$EXTENSION_UUID"; then
        echo -e "${GREEN}✓ Extension disabled${NC}"
    else
        echo -e "${YELLOW}Warning: Could not disable extension automatically${NC}"
    fi
fi

# Remove extension directory
echo "Removing extension files..."
rm -rf "$INSTALL_DIR"

echo -e "${GREEN}✓ Extension uninstalled successfully${NC}"
echo ""
echo "=========================================="
echo "Uninstallation Complete!"
echo "=========================================="
echo ""
echo "To complete the removal:"
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
    echo "- Press Alt+F2, type 'r', press Enter to restart GNOME Shell"
else
    echo "- Log out and log back in (Wayland)"
fi
echo ""
