# gp-gnome v1.3.2

GNOME Shell extension for GlobalProtect VPN CLI (PanGPLinux) integration.

## What's Changed

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

## Installation

Download the `gp-gnome@totoshko88.github.io.zip` file and install using:

```bash
gnome-extensions install gp-gnome@totoshko88.github.io.zip --force
gnome-extensions enable gp-gnome@totoshko88.github.io
```

Then restart GNOME Shell:
- **Wayland**: Log out and log back in
- **X11**: Press `Alt+F2`, type `r`, press Enter

## Requirements

- GNOME Shell 45, 46, 47, 48, or 49
- GlobalProtect CLI installed and available in PATH

## Documentation

See [README.md](https://github.com/totoshko88/gp-gnome/blob/main/README.md) for full documentation.

## Full Changelog

See [CHANGELOG.md](https://github.com/totoshko88/gp-gnome/blob/main/CHANGELOG.md) for complete version history.
