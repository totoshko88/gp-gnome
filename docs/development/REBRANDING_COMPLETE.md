# Rebranding Complete - gp-gnome

## Date: November 23, 2025

---

## ✅ Rebranding Summary

### Old Name: GlobalProtect VPN Indicator
### New Name: **gp-gnome**

**Reason**: The name "GlobalProtect" is a registered trademark of Palo Alto Networks. Using "gp-gnome" avoids trademark issues while maintaining clear association with GlobalProtect CLI.

---

## 📝 Changes Made

### 1. Extension Identity
- **UUID**: `globalprotect@username.github.io` → `gp-gnome@totoshko88.github.io`
- **Name**: "GlobalProtect VPN Indicator" → "gp-gnome"
- **Author**: Anton Isaiev
- **Email**: totoshko88@gmail.com
- **Repository**: https://github.com/totoshko88/gp-gnome

### 2. Description Updates
**New Description** (SEO optimized):
```
GNOME Shell extension gp-gnome for GlobalProtect VPN CLI (PanGPLinux) integration.
Provides complete VPN management with native GNOME integration, comprehensive 
functionality, and intelligent handling of known CLI issues.

Designed for GlobalProtect CLI (also known as PanGPLinux) - the official 
Palo Alto Networks VPN client for Linux.
```

**Keywords for SEO**:
- gp-gnome
- GlobalProtect CLI
- PanGPLinux
- Palo Alto Networks
- VPN
- GNOME Shell
- Linux

---

## 🔄 Updated Files

### Core Files
1. **metadata.json** ✅
   - UUID: `gp-gnome@totoshko88.github.io`
   - Name: "gp-gnome"
   - Description: Updated with PanGPLinux mention
   - Settings schema: `org.gnome.shell.extensions.gp-gnome`
   - Contact info added

2. **extension.js** ✅
   - All log messages: "GlobalProtect Extension" → "gp-gnome"
   - Comments updated

3. **indicator.js** ✅
   - About dialog updated
   - Version: 1.2.1
   - Full description with PanGPLinux
   - Contact info: Anton Isaiev, totoshko88@gmail.com
   - Repository link

4. **schemas/org.gnome.shell.extensions.gp-gnome.gschema.xml** ✅
   - Renamed from `globalprotect` to `gp-gnome`
   - Schema ID: `org.gnome.shell.extensions.gp-gnome`
   - Path: `/org/gnome/shell/extensions/gp-gnome/`

5. **Makefile** ✅
   - EXTENSION_UUID: `gp-gnome@totoshko88.github.io`
   - SCHEMA_FILES: Updated path
   - Help text updated

6. **README.md** ✅
   - Title: "gp-gnome - GNOME Shell Extension for GlobalProtect VPN"
   - Description mentions PanGPLinux
   - Contact info updated

---

## 📦 New Package

### Package Details
- **File**: `dist/gp-gnome@totoshko88.github.io.zip`
- **Size**: ~244 KB
- **UUID**: `gp-gnome@totoshko88.github.io`

### Package Contents
```
gp-gnome@totoshko88.github.io/
├── extension.js
├── indicator.js
├── gpClient.js
├── statusMonitor.js
├── errorHandler.js
├── prefs.js
├── metadata.json
├── stylesheet.css
├── LICENSE
├── schemas/
│   ├── org.gnome.shell.extensions.gp-gnome.gschema.xml
│   └── gschemas.compiled
└── icons/
    ├── on.png
    ├── off.png
    ├── connecting.png
    └── error.png
```

---

## 🔍 SEO Optimization

### Primary Keywords
1. **gp-gnome** - Extension name
2. **GlobalProtect CLI** - Official name
3. **PanGPLinux** - Alternative name
4. **Palo Alto Networks** - Vendor
5. **GNOME Shell VPN** - Category

### Description Strategy
The description now mentions:
- "gp-gnome" (extension name)
- "GlobalProtect VPN CLI" (official product)
- "PanGPLinux" (alternative name)
- "Palo Alto Networks" (vendor)

This helps users find the extension when searching for:
- "GlobalProtect Linux"
- "PanGPLinux GNOME"
- "Palo Alto VPN Linux"
- "GlobalProtect CLI GUI"

---

## 📋 Contact Information

All files now include:

**Author**: Anton Isaiev  
**Email**: totoshko88@gmail.com  
**Repository**: https://github.com/totoshko88/gp-gnome  
**License**: GPL-3.0-or-later

---

## 🎯 About Dialog

The About dialog (Show → Version) now displays:

```
GlobalProtect CLI version X.X.X

gp-gnome - GNOME Shell Extension
Extension version: 1.2.1

Description:
GNOME Shell extension gp-gnome for GlobalProtect VPN CLI (PanGPLinux) integration.
Provides complete VPN management with native GNOME integration,
comprehensive functionality, and intelligent handling of known CLI issues.

Designed for GlobalProtect CLI (also known as PanGPLinux) -
the official Palo Alto Networks VPN client for Linux.

Features:
• Connect/disconnect with MFA support
• Real-time connection monitoring
• Gateway selection and switching
• Interactive settings configuration
• Advanced operations (HIP, logs, network rediscovery)
• Automatic retry logic for CLI bugs
• Auto-disconnect on logout
• Native GNOME Shell integration

Author: Anton Isaiev
Email: totoshko88@gmail.com
Repository: https://github.com/totoshko88/gp-gnome
License: GPL-3.0-or-later

© 2025 Anton Isaiev
```

---

## 🧪 Testing

### Installation Test
```bash
# Install new package
gnome-extensions install dist/gp-gnome@totoshko88.github.io.zip --force

# Enable extension
gnome-extensions enable gp-gnome@totoshko88.github.io

# Check logs
journalctl -f -o cat /usr/bin/gnome-shell | grep gp-gnome
```

### Expected Log Messages
```
gp-gnome: enable() called
gp-gnome: settings loaded
gp-gnome: client created
gp-gnome: status monitor created
gp-gnome: indicator created
gp-gnome: indicator added to panel
gp-gnome: status monitoring started
gp-gnome: Connected to session manager
```

---

## 📊 Migration Guide

### For Existing Users

If you have the old version installed:

```bash
# Disable old extension
gnome-extensions disable globalprotect@username.github.io

# Uninstall old extension
gnome-extensions uninstall globalprotect@username.github.io

# Install new extension
gnome-extensions install dist/gp-gnome@totoshko88.github.io.zip

# Enable new extension
gnome-extensions enable gp-gnome@totoshko88.github.io

# Restart GNOME Shell
# Wayland: logout/login
# X11: Alt+F2 → r → Enter
```

**Note**: Settings will NOT be migrated automatically. You'll need to reconfigure:
- Portal address
- Poll interval
- Username (if used)
- SSL only mode
- Log level

---

## 🚀 Submission Updates

### extensions.gnome.org

**New Submission Details**:
- **Name**: gp-gnome
- **UUID**: gp-gnome@totoshko88.github.io
- **Description**: (see above - includes PanGPLinux)
- **URL**: https://github.com/totoshko88/gp-gnome
- **Author**: Anton Isaiev
- **Email**: totoshko88@gmail.com

### GitHub Release

**Release Title**: gp-gnome v1.2.1 - Rebranded Release

**Release Notes**:
```markdown
# gp-gnome v1.2.1

## Rebranding

This release renames the extension from "GlobalProtect VPN Indicator" to **gp-gnome** 
to avoid trademark issues. The extension is now clearly identified as a third-party 
tool for GlobalProtect CLI (PanGPLinux) integration.

## What's New

- Extension renamed to gp-gnome
- UUID changed to gp-gnome@totoshko88.github.io
- Description updated to mention PanGPLinux
- Contact information added throughout
- SEO optimized for better discoverability

## Features

All features from v1.2.0 remain:
- Interactive certificate import
- SSL only mode
- Log level configuration
- Username support
- And all previous features

## Installation

Download and install:
```bash
gnome-extensions install gp-gnome@totoshko88.github.io.zip
gnome-extensions enable gp-gnome@totoshko88.github.io
```

## Migration

If upgrading from old version, uninstall the old extension first.
Settings will need to be reconfigured.
```

---

## ✅ Checklist

### Rebranding
- [x] UUID changed
- [x] Name changed
- [x] Description updated
- [x] Schema renamed
- [x] Contact info added
- [x] About dialog updated
- [x] Log messages updated
- [x] README updated
- [x] Makefile updated

### Package
- [x] New package created
- [x] Schema compiled
- [x] All files included
- [x] Correct UUID in package

### Documentation
- [x] README mentions PanGPLinux
- [x] Contact info everywhere
- [x] SEO optimized
- [x] Migration guide created

---

## 🎉 Status

**Rebranding**: ✅ COMPLETE  
**Package**: ✅ READY  
**Documentation**: ✅ UPDATED  
**SEO**: ✅ OPTIMIZED  

**Ready for submission as gp-gnome! 🚀**

