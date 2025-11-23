# gp-gnome - GNOME Shell Extension for GlobalProtect VPN

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-45--49-blue.svg)](https://www.gnome.org/)
[![Version](https://img.shields.io/badge/version-1.2.1-green.svg)](CHANGELOG.md)

**gp-gnome** is a GNOME Shell extension for GlobalProtect VPN CLI (PanGPLinux) integration. Provides complete VPN management with native GNOME integration, comprehensive functionality, and intelligent handling of known CLI issues.

Designed for **GlobalProtect CLI** (also known as **PanGPLinux**) - the official Palo Alto Networks VPN client for Linux.

## ✨ Features

### Core Functionality
- 🔒 **Connect/Disconnect** with MFA (Multi-Factor Authentication) support
- 📊 **Real-time status monitoring** with configurable poll interval
- 🌐 **Gateway selection** with caching and easy switching
- 🔄 **Auto-disconnect** on logout for security
- 🎨 **Custom icons** for all connection states (connected, disconnected, connecting, error)
- 🔔 **Smart notifications** with throttling to prevent spam

### Settings & Configuration
- 🌍 **Portal address** configuration
- ⏱️ **Poll interval** customization (3-60 seconds)
- 👤 **Username** (optional) for automatic authentication
- 🔐 **SSL Only mode** for enhanced security
- 📝 **Log level** configuration (Error, Warning, Info, Debug)
- 📜 **Certificate import** with interactive dialog
- 🗑️ **Clear credentials** functionality

### Advanced Operations
- 🔍 **Rediscover network** - Refresh network configuration
- 🏥 **Resubmit HIP** - Resubmit Host Information Profile
- 📋 **Collect logs** - Gather diagnostic logs (opens folder automatically)
- 🐛 **Report issue** - Generate diagnostic report

### Information Display
- 🖥️ **Host State** - View HIP information with scrolling
- ❌ **Errors** - View error messages
- 📬 **Notifications** - View GlobalProtect notifications
- ❓ **Help** - Access GlobalProtect help
- ℹ️ **Version** - About dialog with extension info

### Technical Features
- 🔄 **Retry logic** for known GlobalProtect CLI bugs
- 🛡️ **Comprehensive error handling** with sensitive data sanitization
- 💾 **Gateway list caching** for better performance
- 📋 **Copy buttons** in all information dialogs
- 🎯 **Interactive dialogs** for all settings

## Screenshots

### System Tray Indicator
![Disconnected State](docs/screenshots/disconnected.png)
*Extension icon when VPN is disconnected*

### Connection Menu
![Connection Menu](docs/screenshots/menu.png)
*Main menu showing connection status and options*

### Connected State
![Connected State](docs/screenshots/connected.png)
*Extension showing active VPN connection with details*

### Settings Window
![Settings](docs/screenshots/settings.png)
*Configuration interface for portal address*

### Advanced Operations
![Advanced Menu](docs/screenshots/advanced.png)
*Advanced operations submenu*

> **Note:** Screenshots show the extension running on GNOME Shell 49. Actual screenshots should be added to the `docs/screenshots/` directory.

## 📋 Requirements

- **GNOME Shell**: 45, 46, 47, 48, or 49
- **GlobalProtect CLI**: Installed and available in PATH
  - Usually located at `/usr/bin/globalprotect` or `/opt/paloaltonetworks/globalprotect/globalprotect`
- **VPN Access**: Valid GlobalProtect VPN portal credentials

## Installation

### Quick Install (Recommended)

1. Clone or download this repository
2. Run the installation script:
```bash
chmod +x install.sh
./install.sh
```

3. Restart GNOME Shell:
   - On X11: Press `Alt+F2`, type `r`, press Enter
   - On Wayland: Log out and log back in

### Using Make

```bash
# Install the extension
make install

# Enable the extension
gnome-extensions enable globalprotect@username.github.io

# Restart GNOME Shell (X11: Alt+F2, type 'r')
```

### Manual Installation

1. Clone or download this repository
2. Copy the extension to your GNOME extensions directory:
```bash
cp -r . ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io/
```

3. Compile the GSettings schema:
```bash
cd ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io/
glib-compile-schemas schemas/
```

4. Restart GNOME Shell:
   - On X11: Press `Alt+F2`, type `r`, press Enter
   - On Wayland: Log out and log back in

5. Enable the extension:
```bash
gnome-extensions enable globalprotect@username.github.io
```

### Uninstallation

```bash
# Using the uninstall script
chmod +x uninstall.sh
./uninstall.sh

# Or using Make
make uninstall
```

## Usage

### Basic Operations

1. **Connect to VPN:**
   - Click the GlobalProtect icon in the system tray
   - Click "Connect"
   - Complete MFA authentication in the browser if prompted
   - Wait for the connection to establish

2. **Disconnect from VPN:**
   - Click the GlobalProtect icon
   - Click "Disconnect"

3. **View Connection Status:**
   - The icon in the system tray shows the current connection state:
     - 🔴 Red/Off: Disconnected
     - 🟡 Yellow/Connecting: Connecting or disconnecting
     - 🟢 Green/On: Connected
     - ⚠️ Error: Connection error
   - Click the icon to see detailed connection information

### Configuration

1. Click the GlobalProtect icon
2. Click "Settings"
3. Enter your VPN portal address (e.g., `vpn.epam.com`)
4. The portal address is validated automatically
5. Close the settings window to save

### Advanced Operations

Click the GlobalProtect icon and select "Advanced" to access:

- **Rediscover Network:** Refresh network configuration
- **Resubmit HIP:** Resubmit Host Information Profile
- **Collect Logs:** Collect GlobalProtect logs for troubleshooting

## Configuration

The extension stores settings in GSettings:

- **Portal Address:** The VPN portal to connect to (default: `vpn.epam.com`)
- **Poll Interval:** How often to check VPN status in seconds (default: 5)

You can also configure these using `gsettings`:

```bash
# Set portal address
gsettings set org.gnome.shell.extensions.globalprotect portal-address "vpn.example.com"

# Set poll interval (in seconds)
gsettings set org.gnome.shell.extensions.globalprotect poll-interval 10
```

## Troubleshooting

### Extension Not Appearing

1. Check if the extension is enabled:
```bash
gnome-extensions list --enabled | grep globalprotect
```

2. Check for errors in the logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect
```

3. Restart GNOME Shell (X11 only):
```bash
# Press Alt+F2, type 'r', press Enter
```

### Connection Issues

1. Verify GlobalProtect CLI is installed:
```bash
which globalprotect
globalprotect --version
```

2. Test the CLI directly:
```bash
globalprotect show --status
```

3. Check extension logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i error
```

### Settings Not Saving

1. Recompile the GSettings schema:
```bash
cd ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io/
glib-compile-schemas schemas/
```

2. Restart GNOME Shell

## Development

### Running Tests

The extension includes comprehensive test suites:

```bash
# Run property-based tests (100+ iterations per property)
gjs tests/run-property-tests.js

# Run unit tests
gjs tests/run-unit-tests.js

# Run GNOME Extension Review Guidelines validation
bash tests/validate-review-guidelines.sh

# Run CLI integration tests
bash tests/test-cli-integration.sh
```

### Project Structure

```
globalprotect@username.github.io/
├── extension.js          # Main extension class
├── prefs.js             # Preferences UI
├── indicator.js         # System tray indicator
├── gpClient.js          # GlobalProtect CLI wrapper
├── statusMonitor.js     # VPN status monitoring
├── errorHandler.js      # Error handling utility
├── metadata.json        # Extension metadata
├── stylesheet.css       # UI styling
├── schemas/             # GSettings schema
│   └── org.gnome.shell.extensions.globalprotect.gschema.xml
├── icons/               # Custom icons
│   ├── on.png          # Connected state
│   ├── off.png         # Disconnected state
│   ├── connecting.png  # Transitioning state
│   └── error.png       # Error state
└── tests/              # Test suites
    ├── run-property-tests.js
    ├── run-unit-tests.js
    └── validate-review-guidelines.sh
```

### Architecture

The extension follows a modular architecture:

- **Extension:** Main lifecycle management (enable/disable)
- **GlobalProtectClient:** Async wrapper for GlobalProtect CLI commands
- **StatusMonitor:** Periodic polling of VPN connection status
- **GlobalProtectIndicator:** UI component in system tray
- **ErrorHandler:** Centralized error handling with sanitization

All operations are asynchronous to prevent blocking the GNOME Shell UI.

## Security

The extension implements several security measures:

- **Command Injection Prevention:** All CLI commands use array arguments, not shell strings
- **Sensitive Data Sanitization:** Passwords, tokens, and cookies are removed from logs
- **Async Operations:** No blocking operations that could freeze the UI
- **Proper Resource Cleanup:** All resources are cleaned up on disable

## Distribution

### Creating a Release Package

```bash
# Create distribution package
make dist

# Package will be created at: dist/globalprotect@username.github.io.zip
```

### Submitting to extensions.gnome.org

1. Create an account on https://extensions.gnome.org
2. Upload the distribution package
3. Fill in extension information
4. Add screenshots
5. Submit for review

See [DISTRIBUTION.md](DISTRIBUTION.md) for detailed instructions.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

Quick start:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the test suites
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2025 Anton Isaiev <totoshko88@gmail.com>

## Credits

Developed for GNOME Shell 49 with GlobalProtect VPN CLI integration.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

## Changelog

### Version 1.0.0
- Initial release
- Basic connect/disconnect functionality
- MFA authentication support
- Status monitoring
- Advanced operations (rediscover network, resubmit HIP, collect logs)
- Custom icons for connection states
- Settings UI for portal configuration
- Comprehensive error handling
- Property-based and unit test suites
