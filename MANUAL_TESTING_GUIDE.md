# Manual Testing Guide for GlobalProtect Extension

This guide provides step-by-step instructions for manually testing the GNOME GlobalProtect Extension with the real GlobalProtect CLI.

## Prerequisites

1. GlobalProtect CLI must be installed on your system
2. GNOME Shell 49 or compatible version
3. Access to a GlobalProtect VPN portal (e.g., vpn.epam.com)

## Installation

1. Install the extension:
```bash
# Link extension to GNOME extensions directory
ln -s $(pwd) ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io

# Compile GSettings schema
glib-compile-schemas schemas/

# Restart GNOME Shell
# On X11: Press Alt+F2, type 'r', press Enter
# On Wayland: Log out and log back in

# Enable the extension
gnome-extensions enable globalprotect@username.github.io
```

2. Verify the extension is loaded:
```bash
gnome-extensions list --enabled | grep globalprotect
```

## Test Cases

### Test 1: Connection to vpn.epam.com

**Objective:** Verify basic connection functionality

**Steps:**
1. Click on the GlobalProtect indicator in the system tray
2. Verify the menu shows "Not connected" status
3. Click "Connect" button
4. Observe the icon changes to "connecting" state (connecting.png)
5. Wait for MFA authentication prompt in browser
6. Complete MFA authentication
7. Verify the icon changes to "connected" state (on.png)
8. Verify the status label shows "Connected to vpn.epam.com"
9. Verify a success notification appears

**Expected Results:**
- Icon transitions: off.png → connecting.png → on.png
- Status label updates correctly
- Notification displays "Connected to VPN"
- No errors in system logs

**Validation:**
```bash
# Check system logs for errors
journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect

# Verify actual VPN connection
globalprotect show --status
```

### Test 2: MFA Authentication Flow

**Objective:** Verify MFA authentication works correctly

**Steps:**
1. Ensure VPN is disconnected
2. Click "Connect" in the extension menu
3. Observe "Waiting for authentication..." status appears
4. Browser window should open automatically for MFA
5. Complete MFA authentication in browser
6. Return to GNOME Shell
7. Verify connection completes successfully

**Expected Results:**
- Status shows "Waiting for authentication..." during MFA
- Browser window opens without blocking
- Extension detects MFA completion
- Connection succeeds after MFA

**Validation:**
- No blocking of UI during MFA
- Browser window opens correctly
- Status updates reflect MFA progress

### Test 3: Disconnect Functionality

**Objective:** Verify disconnection works correctly

**Steps:**
1. Ensure VPN is connected (complete Test 1 first)
2. Click on the GlobalProtect indicator
3. Verify menu shows "Connected to vpn.epam.com"
4. Click "Disconnect" button
5. Observe icon changes to "connecting" state briefly
6. Verify icon changes to "disconnected" state (off.png)
7. Verify status label shows "Not connected"
8. Verify a notification appears

**Expected Results:**
- Icon transitions: on.png → connecting.png → off.png
- Status label updates to "Not connected"
- Notification displays "Disconnected from VPN"
- No errors in system logs

**Validation:**
```bash
# Verify VPN is disconnected
globalprotect show --status
```

### Test 4: Status Monitoring

**Objective:** Verify status polling works correctly

**Steps:**
1. Connect to VPN using the extension
2. Wait for 5-10 seconds
3. Manually disconnect using CLI: `globalprotect disconnect`
4. Observe the extension icon and status
5. Verify the extension detects the disconnection within 5 seconds
6. Verify icon and status update automatically

**Expected Results:**
- Extension polls status every 5 seconds
- Extension detects external disconnection
- Icon and status update automatically
- No excessive CPU usage from polling

**Validation:**
```bash
# Monitor extension activity
journalctl -f -o cat /usr/bin/gnome-shell | grep -i "poll\|status"
```

### Test 5: Advanced Commands - Rediscover Network

**Objective:** Verify rediscover network command works

**Steps:**
1. Ensure VPN is connected
2. Click on the GlobalProtect indicator
3. Click "Advanced" submenu
4. Click "Rediscover Network"
5. Verify a notification appears
6. Check system logs for command execution

**Expected Results:**
- Command executes without errors
- Notification displays "Network Rediscovery completed successfully"
- No UI freezing during command execution

**Validation:**
```bash
# Check logs for command execution
journalctl -f -o cat /usr/bin/gnome-shell | grep -i "rediscover"
```

### Test 6: Advanced Commands - Resubmit HIP

**Objective:** Verify HIP resubmission command works

**Steps:**
1. Ensure VPN is connected
2. Click on the GlobalProtect indicator
3. Click "Advanced" submenu
4. Click "Resubmit HIP"
5. Verify a notification appears
6. Check system logs for command execution

**Expected Results:**
- Command executes without errors
- Notification displays "HIP Resubmission completed successfully"
- No UI freezing during command execution

**Validation:**
```bash
# Check logs for command execution
journalctl -f -o cat /usr/bin/gnome-shell | grep -i "hip"
```

### Test 7: Advanced Commands - Collect Logs

**Objective:** Verify log collection command works

**Steps:**
1. Ensure VPN is connected
2. Click on the GlobalProtect indicator
3. Click "Advanced" submenu
4. Click "Collect Logs"
5. Wait for command to complete (may take longer)
6. Verify a notification appears
7. Check system logs for command execution

**Expected Results:**
- Command executes without errors (may take 30-60 seconds)
- Notification displays "Log Collection completed successfully"
- No UI freezing during command execution
- Timeout is set to 60 seconds for this command

**Validation:**
```bash
# Check logs for command execution
journalctl -f -o cat /usr/bin/gnome-shell | grep -i "collect"
```

### Test 8: Error Scenarios

**Objective:** Verify error handling works correctly

#### Test 8a: Connection to Invalid Portal

**Steps:**
1. Open extension settings
2. Change portal address to "invalid.portal.test"
3. Try to connect
4. Verify error notification appears
5. Verify error icon shows briefly
6. Verify status returns to disconnected

**Expected Results:**
- Error notification displays user-friendly message
- Error icon (error.png) shows briefly
- No sensitive information in error messages
- Extension remains functional after error

#### Test 8b: GlobalProtect CLI Not Installed

**Steps:**
1. Temporarily rename globalprotect binary: `sudo mv /usr/bin/globalprotect /usr/bin/globalprotect.bak`
2. Try to connect using extension
3. Verify error notification appears
4. Restore binary: `sudo mv /usr/bin/globalprotect.bak /usr/bin/globalprotect`

**Expected Results:**
- Error notification: "GlobalProtect CLI is not installed or not in PATH"
- Extension handles missing CLI gracefully
- No crashes or freezes

#### Test 8c: MFA Timeout

**Steps:**
1. Start connection process
2. When MFA browser window opens, wait without completing authentication
3. Wait for timeout (30 seconds)
4. Verify error notification appears

**Expected Results:**
- Timeout occurs after 30 seconds
- Error notification displays
- Extension returns to disconnected state
- No hanging processes

### Test 9: Settings Persistence

**Objective:** Verify settings are saved and loaded correctly

**Steps:**
1. Open extension settings (click Settings in menu)
2. Change portal address to "test.vpn.com"
3. Close settings window
4. Disable and re-enable the extension
5. Open settings again
6. Verify portal address is still "test.vpn.com"
7. Change back to "vpn.epam.com"

**Expected Results:**
- Settings persist across extension disable/enable
- Settings persist across GNOME Shell restarts
- Default value is "vpn.epam.com"

### Test 10: Settings Validation

**Objective:** Verify portal address validation works

**Steps:**
1. Open extension settings
2. Try to enter invalid portal addresses:
   - Empty string
   - "invalid"
   - "256.256.256.256"
   - "not a domain"
3. Verify validation errors appear
4. Try valid addresses:
   - "vpn.epam.com"
   - "192.168.1.1"
5. Verify they are accepted

**Expected Results:**
- Invalid addresses show validation error
- Valid addresses are accepted
- Error styling appears for invalid input
- Settings are not saved for invalid input

### Test 11: Resource Cleanup

**Objective:** Verify proper resource cleanup on disable

**Steps:**
1. Enable the extension
2. Connect to VPN
3. Disable the extension: `gnome-extensions disable globalprotect@username.github.io`
4. Check for memory leaks or hanging processes
5. Re-enable the extension
6. Verify it works correctly after re-enable

**Expected Results:**
- All timeouts are cleaned up on disable
- All signal connections are disconnected
- No memory leaks
- Extension works correctly after re-enable
- Status monitoring stops when disabled

**Validation:**
```bash
# Check for memory leaks
gnome-shell --replace &
# Monitor memory usage
watch -n 1 'ps aux | grep gnome-shell'
```

### Test 12: Multiple Enable/Disable Cycles

**Objective:** Verify extension handles multiple lifecycle cycles

**Steps:**
1. Enable extension
2. Connect to VPN
3. Disable extension
4. Enable extension
5. Verify status is correct
6. Repeat steps 2-5 three more times

**Expected Results:**
- Extension works correctly after each cycle
- No resource leaks
- No duplicate indicators in panel
- Status monitoring works after each enable

## Test Results Template

Use this template to record test results:

```
Test Case: [Test Name]
Date: [Date]
Tester: [Name]
GNOME Shell Version: [Version]
GlobalProtect CLI Version: [Version]

Result: [PASS/FAIL]

Notes:
- [Any observations]
- [Issues found]
- [Performance notes]

Logs:
[Relevant log excerpts]
```

## Common Issues and Troubleshooting

### Extension Not Appearing in Panel

**Solution:**
```bash
# Check if extension is enabled
gnome-extensions list --enabled | grep globalprotect

# Check for errors
journalctl -f -o cat /usr/bin/gnome-shell | grep -i error

# Restart GNOME Shell
# X11: Alt+F2, type 'r', Enter
# Wayland: Log out and log back in
```

### Settings Not Saving

**Solution:**
```bash
# Check schema is compiled
ls ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io/schemas/gschemas.compiled

# Recompile if needed
cd ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io
glib-compile-schemas schemas/
```

### Connection Hangs

**Solution:**
```bash
# Check GlobalProtect CLI directly
globalprotect show --status

# Kill hanging processes
pkill -f globalprotect

# Check extension logs
journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect
```

## Performance Benchmarks

Record these metrics during testing:

1. **Connection Time:** Time from clicking Connect to connected state
2. **Disconnection Time:** Time from clicking Disconnect to disconnected state
3. **Status Poll Overhead:** CPU usage during status polling
4. **Memory Usage:** Extension memory footprint
5. **UI Responsiveness:** Any lag or freezing during operations

## Sign-off

After completing all tests, sign off:

```
All manual tests completed successfully: [YES/NO]
Date: [Date]
Tester: [Name]
Signature: [Signature]

Issues Found: [Number]
Critical Issues: [Number]
Blockers: [Number]

Ready for Production: [YES/NO]
```
