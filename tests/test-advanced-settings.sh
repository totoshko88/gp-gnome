#!/bin/bash

# Test script for advanced settings

echo "=========================================="
echo "Testing Advanced Settings"
echo "=========================================="
echo ""

echo "Checking code changes..."
echo ""

# Check gpClient methods
if grep -q "async importCertificate" gpClient.js; then
    echo "✅ gpClient has importCertificate() method"
else
    echo "❌ gpClient missing importCertificate() method"
fi

if grep -q "async setConfig" gpClient.js; then
    echo "✅ gpClient has setConfig() method"
else
    echo "❌ gpClient missing setConfig() method"
fi

if grep -q "async setLogLevel" gpClient.js; then
    echo "✅ gpClient has setLogLevel() method"
else
    echo "❌ gpClient missing setLogLevel() method"
fi

# Check indicator methods
if grep -q "_importCertificate()" indicator.js; then
    echo "✅ indicator has _importCertificate() method"
else
    echo "❌ indicator missing _importCertificate() method"
fi

# Check schema keys
if grep -q 'name="ssl-only"' schemas/org.gnome.shell.extensions.globalprotect.gschema.xml; then
    echo "✅ schema has ssl-only key"
else
    echo "❌ schema missing ssl-only key"
fi

if grep -q 'name="log-level"' schemas/org.gnome.shell.extensions.globalprotect.gschema.xml; then
    echo "✅ schema has log-level key"
else
    echo "❌ schema missing log-level key"
fi

# Check UI elements
if grep -q "SSL Only Mode" indicator.js; then
    echo "✅ Settings has SSL Only checkbox"
else
    echo "❌ Settings missing SSL Only checkbox"
fi

if grep -q "Log Level:" indicator.js; then
    echo "✅ Settings has Log Level buttons"
else
    echo "❌ Settings missing Log Level buttons"
fi

if grep -q "Import Certificate" indicator.js; then
    echo "✅ Settings has Import Certificate button"
else
    echo "❌ Settings missing Import Certificate button"
fi

echo ""
echo "=========================================="
echo "Manual Testing Instructions:"
echo "=========================================="
echo ""
echo "1. Test SSL Only Mode:"
echo "   - Open Settings"
echo "   - Check 'SSL Only Mode' checkbox"
echo "   - Click Save"
echo "   - Should see notification with 'SSL Only: enabled'"
echo "   - Connect to VPN"
echo "   - Verify SSL-only connection"
echo ""
echo "2. Test Log Level:"
echo "   - Open Settings"
echo "   - Click 'Debug' button"
echo "   - Click Save"
echo "   - Should see notification with 'Log Level: debug'"
echo "   - Check logs:"
echo "     journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect"
echo ""
echo "3. Test Import Certificate:"
echo "   - Open Settings"
echo "   - Click 'Import Certificate...' button"
echo "   - Should see dialog with path input field"
echo "   - Enter certificate path (e.g., /home/user/cert.pem)"
echo "   - Click Import"
echo "   - Should validate file exists"
echo "   - Should show success notification"
echo ""
echo "4. Test Settings Dialog:"
echo "   - Open Settings"
echo "   - Verify structure:"
echo "     • Portal Address"
echo "     • Poll Interval"
echo "     • Username"
echo "     • ─────────────"
echo "     • Clear Credentials"
echo "     • ─────────────"
echo "     • Advanced Settings"
echo "       - SSL Only Mode checkbox"
echo "       - Log Level buttons"
echo "       - Import Certificate button"
echo ""
echo "=========================================="
echo "Installation:"
echo "=========================================="
echo ""
echo "glib-compile-schemas schemas/"
echo "make uninstall && make install"
echo "# Restart GNOME Shell"
echo "gnome-extensions enable globalprotect@username.github.io"
echo ""
echo "=========================================="
echo "Version: 1.2.0"
echo "=========================================="

