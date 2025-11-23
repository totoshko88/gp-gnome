# Changelog

All notable changes to the GNOME GlobalProtect Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Multiple portal support
- Connection profiles
- Statistics tracking
- Additional language translations

## [1.3.0] - 2025-01-23

### Added
- ESLint configuration for code quality and consistency
- Trademark disclaimer in README.md and metadata.json
- Clipboard usage declaration in metadata.json
- Comprehensive compliance report (REVIEW_COMPLIANCE.md)
- Build release instructions (BUILD_RELEASE.md)

### Improved
- Full compliance with GNOME Shell Extensions Review Guidelines
- Enhanced documentation for contributors
- Code quality standards with linting rules

### Changed
- Updated metadata.json description with trademark notice
- Updated CONTRIBUTING.md with ESLint instructions

## [1.2.1] - 2025-11-23

### Improved
- **Import Certificate**: Interactive dialog with path input field instead of CLI instructions
- Certificate path validation before import
- Real-time feedback for file existence and extension
- Automatic import execution from dialog

### Added
- File validation for certificate import (checks existence and extension)
- Visual feedback for validation errors (red for errors, yellow for warnings)
- Support for multiple certificate formats (.pem, .crt, .cer)

### Changed
- Import Certificate now opens interactive dialog instead of showing notification
- Users can paste certificate path directly into dialog
- Automatic execution of import command after validation

## [1.2.0] - 2025-11-23

### Added
- **SSL Only Mode**: Checkbox in Settings to force SSL-only connections
- **Log Level Configuration**: 4-level log configuration (Error, Warning, Info, Debug)
- **Import Certificate**: Button with CLI instructions for certificate import
- Advanced Settings section in Settings dialog
- New GSettings keys: `ssl-only` and `log-level`

### Changed
- Enhanced Settings dialog with Advanced Settings section
- Settings dialog now includes SSL Only checkbox
- Settings dialog now includes Log Level selection buttons
- Automatic application of SSL and log level settings

### Technical
- Added `importCertificate()` method in gpClient.js
- Added `setConfig()` method in gpClient.js
- Added `setLogLevel()` method in gpClient.js
- Added `_importCertificate()` method in indicator.js
- Extended GSettings schema with new keys

### Fixed
- Resubmit HIP error handling improved with retry logic
- Disconnect now properly updates status with multiple poll attempts
- Added `forceUpdate()` public method in statusMonitor

## [1.1.0] - 2025-11-23

### Added
- **Username support**: Optional username field in Settings dialog for automatic VPN authentication
- **Report Issue**: New menu item in Advanced submenu to generate diagnostic reports
- **GPL-3.0 License**: Full GPL-3.0-or-later licensing with proper headers in all source files
- License information in metadata.json
- Copyright headers in all JavaScript files
- LICENSE file with GPL-3.0 text

### Changed
- Updated `connect()` method to support optional username parameter
- Enhanced Settings dialog with username field
- Updated README.md with proper license information
- Updated metadata.json with license fields

### Technical
- Added `reportIssue()` method in gpClient.js
- Added `_reportIssue()` method in indicator.js
- Username stored in GSettings schema
- All source files now include SPDX-License-Identifier

## [1.0.0] - 2024-01-15

### Added
- Initial release of GNOME GlobalProtect Extension
- Connect/disconnect functionality for GlobalProtect VPN
- Real-time VPN status monitoring with configurable poll interval
- System tray indicator with custom icons for different connection states
- MFA (Multi-Factor Authentication) support via browser
- Configurable VPN portal address through settings UI
- Advanced operations:
  - Network rediscovery
  - HIP (Host Information Profile) resubmission
  - Log collection
- Desktop notifications for connection events and errors
- Comprehensive error handling with sensitive data sanitization
- Async subprocess execution for all GlobalProtect CLI commands
- Proper resource cleanup on extension disable
- GSettings schema for persistent configuration
- Property-based test suite with 13 properties (100+ iterations each)
- Unit test suite for core functionality
- GNOME Extension Review Guidelines validation
- Installation and uninstallation scripts
- Makefile for build automation
- Comprehensive documentation (README, DISTRIBUTION guide)

### Security
- Command injection prevention using array arguments
- Sensitive data sanitization in error logs
- No credential storage in settings
- Proper subprocess security with timeout handling

### Technical Details
- Compatible with GNOME Shell 49
- Modular architecture with separation of concerns
- Async operations to prevent UI blocking
- Signal-based status monitoring
- Custom icon support for connection states

## [0.1.0] - Development

### Added
- Initial development version
- Basic connect/disconnect functionality
- Status monitoring prototype
- Settings UI prototype

---

## Release Notes

### Version 1.0.0

This is the first stable release of the GNOME GlobalProtect Extension. The extension provides a complete graphical interface for managing GlobalProtect VPN connections through the command-line interface.

**Key Features:**
- One-click VPN connection/disconnection
- Real-time status updates in system tray
- MFA authentication support
- Advanced GlobalProtect operations
- Comprehensive error handling

**Requirements:**
- GNOME Shell 49 or compatible version
- GlobalProtect CLI installed and available in PATH
- Access to a GlobalProtect VPN portal

**Installation:**
See [README.md](README.md) for installation instructions.

**Known Issues:**
None at this time.

**Upgrade Notes:**
This is the initial release, no upgrade path needed.

---

## Contributing

When contributing, please update this changelog with your changes under the `[Unreleased]` section. Follow the format:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Changed feature description

### Deprecated
- Deprecated feature description

### Removed
- Removed feature description

### Fixed
- Bug fix description

### Security
- Security fix description
```

## Categories

- **Added:** New features
- **Changed:** Changes in existing functionality
- **Deprecated:** Soon-to-be removed features
- **Removed:** Removed features
- **Fixed:** Bug fixes
- **Security:** Security fixes
