#!/bin/bash

# Test script for new features
# Username, Report Issue, GPL License

echo "=========================================="
echo "Testing New Features"
echo "=========================================="
echo ""

# Check if extension files exist
echo "1. Checking files..."
if [ -f "LICENSE" ]; then
    echo "   ✅ LICENSE file exists"
else
    echo "   ❌ LICENSE file missing"
fi

if [ -f "metadata.json" ]; then
    if grep -q "GPL-3.0-or-later" metadata.json; then
        echo "   ✅ metadata.json has license field"
    else
        echo "   ❌ metadata.json missing license field"
    fi
else
    echo "   ❌ metadata.json missing"
fi

echo ""
echo "2. Checking GPL headers..."
for file in extension.js indicator.js gpClient.js statusMonitor.js errorHandler.js prefs.js; do
    if [ -f "$file" ]; then
        if grep -q "GPL-3.0-or-later" "$file"; then
            echo "   ✅ $file has GPL header"
        else
            echo "   ❌ $file missing GPL header"
        fi
    else
        echo "   ❌ $file not found"
    fi
done

echo ""
echo "3. Checking schema..."
if [ -f "schemas/org.gnome.shell.extensions.globalprotect.gschema.xml" ]; then
    if grep -q 'name="username"' schemas/org.gnome.shell.extensions.globalprotect.gschema.xml; then
        echo "   ✅ Schema has username key"
    else
        echo "   ❌ Schema missing username key"
    fi
else
    echo "   ❌ Schema file not found"
fi

echo ""
echo "4. Checking code..."
if grep -q "reportIssue()" gpClient.js; then
    echo "   ✅ gpClient.reportIssue() method exists"
else
    echo "   ❌ gpClient.reportIssue() method missing"
fi

if grep -q "_reportIssue()" indicator.js; then
    echo "   ✅ indicator._reportIssue() method exists"
else
    echo "   ❌ indicator._reportIssue() method missing"
fi

if grep -q "username" indicator.js; then
    echo "   ✅ indicator.js has username support"
else
    echo "   ❌ indicator.js missing username support"
fi

echo ""
echo "=========================================="
echo "Installation Commands:"
echo "=========================================="
echo ""
echo "# Compile schema"
echo "glib-compile-schemas schemas/"
echo ""
echo "# Reinstall extension"
echo "make uninstall"
echo "make install"
echo ""
echo "# Enable extension"
echo "gnome-extensions enable gp-gnome@totoshko88.github.io"
echo ""
echo "# Restart GNOME Shell"
echo "# X11: Alt+F2 → r → Enter"
echo "# Wayland: Logout and login"
echo ""
echo "=========================================="
echo "Manual Testing:"
echo "=========================================="
echo ""
echo "1. Username:"
echo "   - Open Settings"
echo "   - Enter username"
echo "   - Save"
echo "   - Connect to VPN"
echo "   - Check logs: journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect"
echo ""
echo "2. Report Issue:"
echo "   - Open menu"
echo "   - Advanced → Report Issue"
echo "   - Check dialog appears"
echo "   - Test Copy button"
echo ""
echo "3. License:"
echo "   - Check LICENSE file"
echo "   - Check metadata.json"
echo "   - Check README.md"
echo "   - Check GPL headers in .js files"
echo ""
echo "=========================================="

