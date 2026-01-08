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

## [1.3.9] - 2026-01-06

### Fixed
- **EGO Review**: Added `destroy()` method to StatusMonitor class for proper cleanup

## [1.3.8] - 2026-01-04

### Fixed
- **EGO Review**: Refactored timeout handling in statusMonitor.js - created `_startPollingTimeout()` helper to avoid duplicate timeout creation code

## [1.3.7] - 2026-01-02

### Added
- **CI/CD**: Automatic version update in release workflow - version in "Show → Version" dialog and preferences now auto-updates from git tag
- **i18n**: Added gettext-domain to metadata.json for future localization support
- **i18n**: Added gettext wrapper functions in prefs.js

### Improved
- **Release workflow**: Version strings in indicator.js and prefs.js are automatically updated during release build
- **prefs.js**: Use Gio.Settings.bind() for automatic settings synchronization
- **Makefile**: Added `make pot` target for generating translation templates

## [1.3.6] - 2026-01-02

### Added
- **CI/CD**: GitHub Actions workflow for lint, tests, and EGO validation
- **Security**: SECURITY.md with vulnerability reporting policy
- **Preferences**: Full settings UI in GNOME Extensions preferences (prefs.js)

### Fixed
- **Tests**: Updated shell test scripts with correct extension UUID

### Improved
- **prefs.js**: Simplified with all settings (portal, username, SSL, poll interval)
- **README**: Added CI badge

## [1.3.5] - 2026-01-01

### Fixed
- **Auto-disconnect order**: VPN now disconnects FIRST on disable to ensure logout disconnects work

### Improved
- **Code refactoring**: Extracted retry logic and permission checks into reusable helper methods
- **Poll interval**: Settings changes now apply immediately without extension restart
- **Constants**: Centralized error patterns and messages for better maintainability
- **Release workflow**: Now extracts release notes directly from CHANGELOG.md

## [1.3.4] - 2025-12-11

### Fixed
- **EGO Review compliance**: Removed dead code (unused session mode handler, unnecessary variable)
- **EGO Review compliance**: Removed try-catch wrapper from enable() - GNOME Shell handles errors
- **EGO Review compliance**: Replaced setTimeout with GLib.timeout_add for proper cleanup on destroy
- **Auto-disconnect order**: VPN now disconnects FIRST on disable to ensure logout disconnects work

### Improved
- **Code refactoring**: Extracted retry logic and permission checks into reusable helper methods
- **Poll interval**: Settings changes now apply immediately without extension restart
- **Constants**: Centralized error patterns and messages for better maintainability

## [1.3.3] - 2025-12-02

### Fixed
- **False disconnect status**: Added debounce logic to prevent temporary CLI glitches from showing false disconnected status
- **Permission error false positives**: Fixed "another user" error showing when CLI returns valid data
- **Gateway switch icon**: Show "Connecting" icon during gateway switch instead of "Disconnected"
- **Empty Host State**: Handle empty host state response with informative message
- **Show commands stability**: Added destroyed checks to prevent async callbacks after extension disable

### Changed
- **Disconnect debounce**: Require 2 consecutive disconnected polls before showing disconnected status
- **Permission error logic**: Only check for permission errors when stdout is empty
- **Gateway switch flow**: Properly set connecting state and update icon during gateway change

### Improved
- **Status stability**: Icon no longer flickers when clicking on extension or during Show operations
- **Error handling**: More accurate detection of real permission errors vs CLI quirks
- **Code quality**: Centralized permission error checking with `_isPermissionError()` helper

## [1.3.2] - 2025-12-02

### Fixed
- **Shell freeze on disable**: Fixed critical issue where GNOME Shell would freeze when disabling extension
- **Auto-disconnect on logout**: Fixed VPN not disconnecting when user logs out
- **Connection details display**: Fixed Gateway, Assigned IP, and Gateway IP not showing in menu
- **Field parsing**: Corrected parsing of GlobalProtect CLI output fields (Gateway Name, Assigned IP Address, Gateway IP Address)
- **Icon flickering**: Added stabilization delay for Show menu operations to prevent icon changes
- **Another user error**: Added proper error handling for "another user" permission errors in all commands

### Changed
- **Disable order**: Changed cleanup order - cancel gpClient operations before destroying indicator
- **Logout disconnect**: Uses synchronous disconnect to ensure VPN disconnects before logout completes
- **Async operations**: Added timeout (3s) for connection details fetch to prevent hanging

### Improved
- **Error messages**: Clear user-friendly messages when GlobalProtect runs under different user
- **Resource cleanup**: Better cleanup with _isDestroyed flag to prevent async callbacks after destroy
- **Stability**: More robust handling of edge cases during extension lifecycle

## [1.3.1] - 2025-12-01

### Fixed
- **Review compliance**: All issues from extensions.gnome.org review addressed
- **Logging**: Replaced deprecated `log()` with `console.*` and removed excessive logging
- **Timeouts**: Proper timeout tracking and cleanup in all `destroy()` methods
- **Subprocess**: Implemented `Gio.Cancellable` for all subprocess operations with signal handling
- **Memory leaks**: All timeouts and subprocess operations properly cleaned up on disable
- **Race conditions**: Added operation lock to prevent concurrent connect/disconnect operations
- **Icon flickering**: Fixed icon changing to disconnected during non-connection operations

### Changed
- **Icons**: Converted custom icons from PNG to SVG format for better scaling
- **Code quality**: Removed unnecessary try-catch wrappers
- **metadata.json**: Removed deprecated `license` and `license-url` fields
- **Distribution**: Removed `gschemas.compiled` from repository (generated during install)
- **Cleanup order**: Resources now cleaned up in reverse order of creation

### Improved
- **Cancellable handling**: Proper cancellation signal support in all async operations
- **Input validation**: Added type checking for all method parameters
- **Constants**: Replaced magic numbers with named constants
- **Error handling**: Enhanced signal disconnection with validation
- **Resource cleanup**: Improved cleanup order prevents edge cases
- **UX**: Icon stays consistent during info operations (logs, errors, HIP, etc.)

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
