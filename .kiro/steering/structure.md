# Project Structure

## Root Files

- **extension.js**: Main extension class, lifecycle management (enable/disable)
- **prefs.js**: Preferences UI (GTK allowed here, not in extension.js)
- **indicator.js**: System tray indicator UI component
- **gpClient.js**: GlobalProtect CLI wrapper with async operations
- **statusMonitor.js**: Periodic VPN status polling
- **errorHandler.js**: Centralized error handling with sanitization
- **metadata.json**: Extension metadata (UUID, version, shell compatibility)
- **stylesheet.css**: UI styling
- **Makefile**: Build automation

## Configuration

- **schemas/**: GSettings schema definitions
  - `org.gnome.shell.extensions.globalprotect.gschema.xml`: Settings schema
  - `gschemas.compiled`: Compiled schema (generated)

## Assets

- **icons/**: Custom state icons
  - `on.png`: Connected state
  - `off.png`: Disconnected state
  - `connecting.png`: Transitioning state
  - `error.png`: Error state

## Testing

- **tests/**: Test suites
  - `run-unit-tests.js`: Unit test runner
  - `run-property-tests.js`: Property-based test runner
  - `properties/`: Property-based tests (Jasmine + fast-check)
  - `mocks/`: GNOME API mocks for testing
  - `spec/`: Test configuration
  - `*.sh`: Integration and validation test scripts

## Documentation

- **docs/development/**: Development notes and implementation history
- **docs/screenshots/**: UI screenshots for README
- **README.md**: Main documentation
- **CONTRIBUTING.md**: Contribution guidelines
- **CHANGELOG.md**: Version history
- **MANUAL_TESTING_GUIDE.md**: Manual testing procedures

## Scripts

- **install.sh**: Quick installation script
- **uninstall.sh**: Uninstallation script
- **test-*.sh**: Feature-specific test scripts

## Architecture Pattern

The extension follows a modular, separation-of-concerns architecture:

1. **Extension** (extension.js): Lifecycle management only
2. **GlobalProtectClient** (gpClient.js): CLI command wrapper, all async
3. **StatusMonitor** (statusMonitor.js): Polling logic, state management
4. **GlobalProtectIndicator** (indicator.js): UI rendering, user interactions
5. **ErrorHandler** (errorHandler.js): Centralized error handling

All components are created in `enable()` and cleaned up in `disable()`. No global state is maintained outside the extension instance.
