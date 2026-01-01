#!/bin/bash

# Test script for bugfixes round 5

echo "=========================================="
echo "Testing Bugfixes - Round 5"
echo "=========================================="
echo ""

echo "Checking code changes..."
echo ""

# Check resubmitHip has retry logic
if grep -q "async resubmitHip(retryCount = 0)" gpClient.js; then
    echo "✅ resubmitHip has retry logic"
else
    echo "❌ resubmitHip missing retry logic"
fi

# Check forceUpdate method exists
if grep -q "async forceUpdate()" statusMonitor.js; then
    echo "✅ statusMonitor has forceUpdate() method"
else
    echo "❌ statusMonitor missing forceUpdate() method"
fi

# Check disconnect has multiple poll attempts
if grep -q "for (let i = 0; i < 3; i++)" indicator.js; then
    echo "✅ disconnect has multiple status update attempts"
else
    echo "❌ disconnect missing multiple attempts"
fi

# Check disconnect uses forceUpdate
if grep -q "forceUpdate()" indicator.js; then
    echo "✅ disconnect uses forceUpdate()"
else
    echo "❌ disconnect not using forceUpdate()"
fi

echo ""
echo "=========================================="
echo "Manual Testing Instructions:"
echo "=========================================="
echo ""
echo "1. Test Resubmit HIP:"
echo "   - Connect to VPN"
echo "   - Open menu → Advanced → Resubmit HIP"
echo "   - Should show success notification"
echo "   - Should NOT show error"
echo ""
echo "2. Test Disconnect:"
echo "   - Connect to VPN"
echo "   - Click Disconnect"
echo "   - Watch status change:"
echo "     • Should show 'Disconnecting...'"
echo "     • Should change to 'Not connected' in ~1.5 seconds"
echo "     • Icon should change from 'connecting' to 'off'"
echo ""
echo "3. Test Menu Structure:"
echo "   - Open menu"
echo "   - Check Show submenu:"
echo "     • Host State"
echo "     • Errors"
echo "     • Notifications"
echo "     • Help"
echo "     • Version"
echo "   - Settings should be SEPARATE (not in Show)"
echo ""
echo "=========================================="
echo "Installation:"
echo "=========================================="
echo ""
echo "glib-compile-schemas schemas/"
echo "make uninstall && make install"
echo "# Restart GNOME Shell"
echo "gnome-extensions enable gp-gnome@totoshko88.github.io"
echo ""
echo "=========================================="

