# Release Complete - gp-gnome v1.2.1

## Date: November 23, 2025

---

## ✅ Release Status: COMPLETE

### Git Repository
- **Commit**: e88d387
- **Tag**: v1.2.1
- **Branch**: main
- **Remote**: https://github.com/totoshko88/gp-gnome.git
- **Status**: ✅ Pushed to GitHub

### Package
- **File**: `dist/gp-gnome@totoshko88.github.io.zip`
- **Size**: 244 KB
- **UUID**: gp-gnome@totoshko88.github.io
- **Status**: ✅ Ready for distribution

---

## 📦 What's Included

### Extension Files
- 6 JavaScript files (extension, indicator, gpClient, statusMonitor, errorHandler, prefs)
- 1 CSS stylesheet
- 1 metadata.json
- 1 LICENSE file
- 4 PNG icons
- GSettings schema (XML + compiled)

### Documentation
- README.md
- CHANGELOG.md
- CONTRIBUTING.md
- MANUAL_TESTING_GUIDE.md
- DISTRIBUTION.md
- QUICK_START.md

### Development
- Makefile for build automation
- Test suite (unit + property-based)
- CI/CD workflows (.github/)
- Development documentation (docs/development/)

---

## 🎯 Next Steps

### 1. Create GitHub Release
1. Go to: https://github.com/totoshko88/gp-gnome/releases/new
2. Select tag: v1.2.1
3. Title: "gp-gnome v1.2.1 - Rebranded Release"
4. Upload: `dist/gp-gnome@totoshko88.github.io.zip`
5. Add release notes (see below)
6. Publish release

### 2. Submit to extensions.gnome.org
1. Go to: https://extensions.gnome.org/upload/
2. Login with GNOME account
3. Upload: `dist/gp-gnome@totoshko88.github.io.zip`
4. Fill in details:
   - Name: gp-gnome
   - Description: (from metadata.json)
   - URL: https://github.com/totoshko88/gp-gnome
5. Add screenshots
6. Submit for review

---

## 📝 Release Notes Template

```markdown
# gp-gnome v1.2.1 - Rebranded Release

## What's New

### Rebranding
- Extension renamed from "GlobalProtect VPN Indicator" to **gp-gnome**
- New UUID: `gp-gnome@totoshko88.github.io`
- SEO optimized description mentioning GlobalProtect CLI and PanGPLinux
- Contact information: Anton Isaiev <totoshko88@gmail.com>

### Features (from v1.2.0)
- **Interactive Certificate Import**: Dialog with path input and validation
- **SSL Only Mode**: Force SSL-only connections
- **Log Level Configuration**: Error, Warning, Info, Debug levels
- **Username Support**: Optional username for automatic authentication
- **Improved Disconnect**: Multiple status update attempts for reliable disconnect
- **Enhanced HIP Resubmission**: Retry logic for better reliability
- **Report Issue**: Generate diagnostic reports

### All Features
- Connect/disconnect with MFA support
- Real-time connection monitoring
- Gateway selection and switching
- Interactive settings dialogs
- Advanced operations (HIP, logs, network rediscovery)
- Auto-disconnect on logout
- Retry logic for CLI bugs
- Native GNOME Shell integration

## Installation

### From extensions.gnome.org
Coming soon after review approval.

### Manual Installation
```bash
# Download
wget https://github.com/totoshko88/gp-gnome/releases/download/v1.2.1/gp-gnome@totoshko88.github.io.zip

# Install
gnome-extensions install gp-gnome@totoshko88.github.io.zip --force

# Enable
gnome-extensions enable gp-gnome@totoshko88.github.io

# Restart GNOME Shell
# Wayland: logout/login
# X11: Alt+F2 → r → Enter
```

### From Source
```bash
git clone https://github.com/totoshko88/gp-gnome.git
cd gp-gnome
make install
gnome-extensions enable gp-gnome@totoshko88.github.io
```

## Requirements
- GNOME Shell 45, 46, 47, 48, or 49
- GlobalProtect CLI (PanGPLinux) installed

## Documentation
- [README.md](https://github.com/totoshko88/gp-gnome/blob/main/README.md)
- [CHANGELOG.md](https://github.com/totoshko88/gp-gnome/blob/main/CHANGELOG.md)
- [MANUAL_TESTING_GUIDE.md](https://github.com/totoshko88/gp-gnome/blob/main/MANUAL_TESTING_GUIDE.md)

## License
GPL-3.0-or-later

## Author
Anton Isaiev <totoshko88@gmail.com>

## Full Changelog
See [CHANGELOG.md](https://github.com/totoshko88/gp-gnome/blob/main/CHANGELOG.md)
```

---

## 📊 Statistics

### Repository
- **Files**: 99
- **Lines Added**: 20,097
- **Commits**: 1 (initial release)
- **Tags**: 1 (v1.2.1)

### Code
- **JavaScript**: ~3,500 lines
- **Functions**: 60+
- **Features**: 25+
- **Tests**: Unit + Property-based

### Package
- **Size**: 244 KB
- **Files**: 18
- **Icons**: 4 PNG files
- **Documentation**: 6 MD files

---

## ✅ Verification

### Local Installation
- ✅ Extension installed locally
- ✅ Extension working correctly
- ✅ All features tested
- ✅ No errors in logs

### Git Repository
- ✅ Code committed
- ✅ Tag created (v1.2.1)
- ✅ Pushed to GitHub
- ✅ Repository accessible

### Package
- ✅ Package created
- ✅ All files included
- ✅ Schema compiled
- ✅ Ready for distribution

---

## 🎉 Success!

**gp-gnome v1.2.1 has been successfully released!**

- ✅ Code committed and tagged
- ✅ Pushed to GitHub
- ✅ Package ready for distribution
- ✅ Documentation complete
- ✅ Ready for extensions.gnome.org submission

**Next**: Create GitHub release and upload package

---

## 📞 Contact

**Author**: Anton Isaiev  
**Email**: totoshko88@gmail.com  
**Repository**: https://github.com/totoshko88/gp-gnome  
**License**: GPL-3.0-or-later

