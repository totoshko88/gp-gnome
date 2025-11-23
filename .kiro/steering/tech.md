# Technology Stack

## Platform

- **GNOME Shell**: 45, 46, 47, 48, 49
- **Language**: JavaScript (GJS - GNOME JavaScript bindings)
- **Runtime**: GJS (GNOME JavaScript runtime)

## Core Technologies

- **GJS/GObject Introspection**: For GNOME Shell extension development
- **Gio**: Async subprocess execution and file operations
- **GLib**: Utilities, timeouts, and event loop integration
- **GSettings**: Configuration storage via GSchema

## Testing

- **Jasmine**: Unit testing framework
- **fast-check**: Property-based testing library
- **Manual testing**: Shell scripts for integration testing

## Build System

Uses **Make** for build automation and **glib-compile-schemas** for GSettings schema compilation.

## Common Commands

```bash
# Install extension to user directory
make install

# Uninstall extension
make uninstall

# Create distribution package
make dist

# Run all tests
make test

# Run unit tests only
make test-unit

# Run property-based tests only
make test-props

# Enable extension
gnome-extensions enable globalprotect@username.github.io

# Restart GNOME Shell (X11 only)
# Press Alt+F2, type 'r', press Enter

# View logs
journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect
```

## Dependencies

- **GlobalProtect CLI**: Must be installed and available in PATH (`/usr/bin/globalprotect` or `/opt/paloaltonetworks/globalprotect/globalprotect`)
- **glib-compile-schemas**: For compiling GSettings schemas
- **zip**: For creating distribution packages

## Development Tools

- **gjs**: For running tests outside GNOME Shell
- **gnome-extensions**: CLI tool for managing extensions
