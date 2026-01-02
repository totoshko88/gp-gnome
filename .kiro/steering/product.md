---
inclusion: always
---

# Product Overview

gp-gnome is a native GNOME Shell extension providing GlobalProtect VPN CLI (PanGPLinux) integration via a system tray indicator.

## Core Purpose

Replace manual CLI usage with a graphical interface for managing GlobalProtect VPN connections directly from the GNOME Shell panel.

## Key Capabilities

- Connect/disconnect with MFA (SAML/browser-based authentication) support
- Real-time status monitoring with configurable polling intervals
- Gateway selection, switching, and preferred gateway configuration
- Advanced operations: HIP resubmission, log collection, network rediscovery
- Automatic retry logic for known GlobalProtect CLI bugs ("already established" errors)
- Auto-disconnect on extension disable (logout/lock security)
- Custom SVG status icons (on, off, connecting, error)

## Target Environment

- GNOME Shell versions 45-49
- GlobalProtect CLI (PanGPLinux) installed at `/usr/bin/globalprotect` or `/opt/paloaltonetworks/globalprotect/globalprotect`
- Linux desktop users preferring GUI over CLI

## Extension Behavior

- All VPN operations are async using Gio.Subprocess
- Status polling via GLib.timeout with configurable intervals
- Settings stored in GSettings (org.gnome.shell.extensions.gp-gnome)
- No GTK imports in extension.js (only allowed in prefs.js)
- All components created in enable(), destroyed in disable()
- No global state outside extension instance

## User-Facing Features

- Panel indicator with status icon
- Dropdown menu: Connect/Disconnect, Gateway selection, Advanced operations, Settings
- Modal dialogs for: Host state, Errors, Notifications, Help, Version info
- Copy-to-clipboard functionality in info dialogs
- Notification throttling to prevent spam

## License

GPL-3.0-or-later
