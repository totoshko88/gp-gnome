# gp-gnome v1.3.4

GNOME Shell extension for GlobalProtect VPN CLI (PanGPLinux) integration.

## What's Changed

### Fixed (EGO Review Compliance)
- **Dead code removal**: Removed unused session mode handler and unnecessary variable
- **Enable error handling**: Removed try-catch wrapper from enable() - GNOME Shell handles errors natively
- **Timeout cleanup**: Replaced setTimeout with GLib.timeout_add for proper cleanup on destroy per [EGO Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html#remove-main-loop-sources)

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
