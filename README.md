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

## 📸 Screenshots

### Disconnected State
![Disconnected State](docs/screenshots/disconnected.png)
*Extension icon in system tray when VPN is disconnected*

### Main Menu
![Connection Menu](docs/screenshots/menu.png)
*Main menu showing connection status, gateway selection, and all available operations*

### Connected State
![Connected State](docs/screenshots/connected.png)
*Extension showing active VPN connection with gateway and IP information*

### Settings Dialog
![Settings](docs/screenshots/settings.png)
*Comprehensive settings dialog with portal, username, SSL mode, log level, and certificate import*

### Advanced Operations
![Advanced Menu](docs/screenshots/advanced.png)
*Advanced operations: Rediscover Network, Resubmit HIP, Collect Logs, Report Issue*

### Show Information
![Show Menu](docs/screenshots/show.png)
*Show menu with Host State, Errors, Notifications, Help, and Version information*

### Host State (HIP)
![Host State](docs/screenshots/hip.png)
*Detailed Host Information Profile with scrollable view and copy button*

### About Dialog
![About](docs/screenshots/about.png)
*About dialog showing extension version, features, and contact information*

## 📋 Requirements

- **GNOME Shell**: 45, 46, 47, 48, or 49
- **GlobalProtect CLI**: Installed and available in PATH
  - Usually located at `/usr/bin/globalprotect` or `/opt/paloaltonetworks/globalprotect/globalprotect`
- **VPN Access**: Valid GlobalProtect VPN portal credentials

## 📦 Installation

### From GitHub Release (Recommended)

1. Download the latest release:
```bash
wget https://github.com/totoshko88/gp-gnome/releases/download/v1.2.1/gp-gnome@totoshko88.github.io.zip
```

2. Install the extension:
```bash
gnome-extensions install gp-gnome@totoshko88.github.io.zip --force
```

3. Enable the extension:
```bash
gnome-extensions enable gp-gnome@totoshko88.github.io
```

4. Restart GNOME Shell:
   - **Wayland**: Log out and log back in
   - **X11**: Press `Alt+F2`, type `r`, press Enter

### From Source

```bash
# Clone the repository
git clone https://github.com/totoshko88/gp-gnome.git
cd gp-gnome

# Install using Make
make install

# Enable the extension
gnome-extensions enable gp-gnome@totoshko88.github.io

# Restart GNOME Shell
```

### Quick Install Script

```bash
# Clone and install
git clone https://github.com/totoshko88/gp-gnome.git
cd gp-gnome
chmod +x install.sh
./install.sh
```

### Uninstallation

```bash
# Using uninstall script
./uninstall.sh

# Or using Make
make uninstall

# Or using gnome-extensions
gnome-extensions uninstall gp-gnome@totoshko88.github.io
```

## 🚀 Usage

### First Time Setup

1. Click the gp-gnome icon in the system tray
2. Click **Settings**
3. Configure:
   - **Portal Address**: Your VPN portal (e.g., `vpn.example.com`)
   - **Poll Interval**: Status check frequency (default: 5 seconds)
   - **Username** (optional): For automatic authentication
   - **SSL Only Mode**: Force SSL-only connections
   - **Log Level**: Error, Warning, Info, or Debug
4. Click **Save**

### Connecting to VPN

1. Click the gp-gnome icon
2. Click **Connect**
3. Complete MFA authentication in browser if prompted
4. Wait for connection to establish
5. Icon will change to show connected state

### Disconnecting from VPN

1. Click the gp-gnome icon
2. Click **Disconnect**
3. Wait for disconnection to complete (~1-2 seconds)

### Connection Status Icons

The system tray icon shows current state:
- 🔴 **Off** (Red): Disconnected
- 🟡 **Connecting** (Yellow): Connecting or disconnecting
- 🟢 **On** (Green): Connected
- ⚠️ **Error** (Orange): Connection error

### Gateway Selection

1. Click the gp-gnome icon
2. Click **Select Gateway**
3. Choose from available gateways
4. Extension will disconnect and reconnect to selected gateway

### Advanced Operations

Access via **Advanced** menu:
- **Rediscover Network**: Refresh network configuration
- **Resubmit HIP**: Resubmit Host Information Profile
- **Collect Logs**: Gather diagnostic logs (opens folder)
- **Report Issue**: Generate diagnostic report

### Information Display

Access via **Show** menu:
- **Host State**: View HIP information
- **Errors**: View error messages
- **Notifications**: View GlobalProtect notifications
- **Help**: Access GlobalProtect help
- **Version**: About dialog with extension info

## ⚙️ Configuration

### Settings via UI

All settings are accessible through the **Settings** dialog:
- Portal Address
- Poll Interval (3-60 seconds)
- Username (optional)
- SSL Only Mode
- Log Level (Error/Warning/Info/Debug)
- Certificate Import

### Settings via Command Line

You can also configure using `gsettings`:

```bash
# Set portal address
gsettings set org.gnome.shell.extensions.gp-gnome portal-address "vpn.example.com"

# Set poll interval (in seconds)
gsettings set org.gnome.shell.extensions.gp-gnome poll-interval 10

# Set username
gsettings set org.gnome.shell.extensions.gp-gnome username "your-username"

# Enable SSL only mode
gsettings set org.gnome.shell.extensions.gp-gnome ssl-only true

# Set log level
gsettings set org.gnome.shell.extensions.gp-gnome log-level "debug"
```

## Troubleshooting

### Extension Not Appearing

1. Check if the extension is enabled:
```bash
gnome-extensions list --enabled | grep gp-gnome
```

2. Check for errors in the logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i gp-gnome
```

3. Restart GNOME Shell:
   - **Wayland**: Log out and log back in
   - **X11**: Press `Alt+F2`, type `r`, press Enter

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
cd ~/.local/share/gnome-shell/extensions/gp-gnome@totoshko88.github.io/
glib-compile-schemas schemas/
```

2. Restart GNOME Shell

### MFA Authentication Issues

1. Ensure your browser is set as default
2. Check that browser can access the portal
3. Complete authentication within timeout period
4. Check logs for specific error messages

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
gp-gnome@totoshko88.github.io/
├── extension.js          # Main extension class
├── prefs.js             # Preferences UI
├── indicator.js         # System tray indicator
├── gpClient.js          # GlobalProtect CLI wrapper
├── statusMonitor.js     # VPN status monitoring
├── errorHandler.js      # Error handling utility
├── metadata.json        # Extension metadata
├── stylesheet.css       # UI styling
├── LICENSE              # GPL-3.0-or-later
├── schemas/             # GSettings schema
│   └── org.gnome.shell.extensions.gp-gnome.gschema.xml
├── icons/               # Custom icons (4 states)
│   ├── on.png          # Connected
│   ├── off.png         # Disconnected
│   ├── connecting.png  # Transitioning
│   └── error.png       # Error
├── tests/              # Test suites
│   ├── run-property-tests.js
│   ├── run-unit-tests.js
│   ├── test-*.sh       # Feature tests
│   └── validate-review-guidelines.sh
└── docs/               # Documentation
    ├── screenshots/    # UI screenshots
    └── development/    # Development notes
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
make package

# Package will be created at: dist/gp-gnome@totoshko88.github.io.zip
```

### Submitting to extensions.gnome.org

See [DISTRIBUTION.md](DISTRIBUTION.md) for detailed submission instructions.

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

## 📝 Changelog

### Version 1.2.1 (Current)
- **Rebranding**: Extension renamed to gp-gnome
- **Interactive Certificate Import**: Dialog with path input and validation
- **SSL Only Mode**: Force SSL-only connections
- **Log Level Configuration**: Error, Warning, Info, Debug levels
- **Username Support**: Optional username for automatic authentication
- **Improved Disconnect**: Multiple status update attempts
- **Enhanced HIP Resubmission**: Retry logic for better reliability
- **Report Issue**: Generate diagnostic reports
- **SEO Optimized**: Description includes GlobalProtect CLI and PanGPLinux keywords
- **GPL-3.0 License**: Proper licensing with headers in all files

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

GPL-3.0-or-later - see [LICENSE](LICENSE) file.

Copyright (C) 2025 Anton Isaiev <totoshko88@gmail.com>

## 👤 Author

**Anton Isaiev**
- Email: totoshko88@gmail.com
- GitHub: [@totoshko88](https://github.com/totoshko88)
- Repository: [gp-gnome](https://github.com/totoshko88/gp-gnome)

## 🙏 Acknowledgments

- Designed for GlobalProtect CLI (PanGPLinux) - Palo Alto Networks VPN client for Linux
- Built for GNOME Shell 45-49
- Tested on Ubuntu 24.04 with GNOME Shell 49

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/totoshko88/gp-gnome/issues)
- **Discussions**: [GitHub Discussions](https://github.com/totoshko88/gp-gnome/discussions)
- **Email**: totoshko88@gmail.com
