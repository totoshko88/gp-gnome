# gp-gnome v1.3.3

GNOME Shell extension for GlobalProtect VPN CLI (PanGPLinux) integration.

## What's Changed

### Fixed
- **Shell freeze on disable**: Simplified async command execution to prevent GNOME Shell freeze when disabling extension
- **False disconnect status**: Added debounce logic requiring 2 consecutive disconnected polls before showing disconnect
- **Permission error false positives**: Check permission errors only when no useful output is returned
- **Gateway switch icon**: Show "Connecting" icon during gateway switch instead of "Disconnected"
- **Empty Host State**: Handle empty host state response with informative message
- **Show commands errors**: Fixed false "another user" errors in Show menu commands

### Improved
- **Async operations**: Removed problematic cancellation handlers that could cause hangs
- **Status stability**: Debounce prevents icon flickering from temporary CLI glitches
- **Error handling**: More accurate permission error detection

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

## Full Changelog

See [CHANGELOG.md](https://github.com/totoshko88/gp-gnome/blob/main/CHANGELOG.md) for complete version history.
