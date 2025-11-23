# Release Checklist v1.2.1

## Date: November 23, 2025

---

## ✅ Pre-Release Verification

### Code Quality
- ✅ All code reviewed and tested
- ✅ No syntax errors
- ✅ No linting errors
- ✅ GPL-3.0 headers in all files
- ✅ Proper JSDoc comments

### Functionality
- ✅ Connect/Disconnect working
- ✅ MFA authentication working
- ✅ Gateway switching working
- ✅ Settings dialog working
- ✅ All menu items functional
- ✅ Advanced operations working
- ✅ Certificate import working

### Documentation
- ✅ README.md updated
- ✅ CHANGELOG.md updated
- ✅ LICENSE file present
- ✅ CONTRIBUTING.md present
- ✅ All documentation accurate

### Compliance
- ✅ GNOME review guidelines followed
- ✅ No deprecated modules used
- ✅ Proper enable/disable implementation
- ✅ No GTK in Shell process
- ✅ No Shell libs in prefs
- ✅ GSettings schema correct
- ✅ metadata.json well-formed

### Testing
- ✅ Manual testing completed
- ✅ Automated tests passing
- ✅ No critical errors in logs
- ✅ Memory leaks checked
- ✅ Clean enable/disable cycles

---

## 📦 Package Preparation

### Files to Include
```
extension.js          ✅
indicator.js          ✅
gpClient.js           ✅
statusMonitor.js      ✅
errorHandler.js       ✅
prefs.js              ✅
metadata.json         ✅
stylesheet.css        ✅
LICENSE               ✅
schemas/              ✅
icons/                ✅
```

### Files to Exclude
```
.git/                 ✅
.github/              ✅
.kiro/                ✅
.vscode/              ✅
.gitignore            ✅
node_modules/         ✅
tests/                ✅
docs/development/     ✅
*.sh                  ✅
Makefile              ✅
package.json          ✅
```

---

## 🔨 Build Steps

### 1. Compile Schema
```bash
glib-compile-schemas schemas/
```
✅ Completed

### 2. Validate metadata.json
```bash
python3 -m json.tool metadata.json > /dev/null
```
✅ Valid JSON

### 3. Create ZIP Package
```bash
make package
# or
gnome-extensions pack \
  --extra-source=gpClient.js \
  --extra-source=statusMonitor.js \
  --extra-source=errorHandler.js \
  --extra-source=indicator.js \
  --extra-source=LICENSE \
  --extra-source=icons/ \
  --extra-source=schemas/
```

### 4. Test Package
```bash
gnome-extensions install globalprotect@username.github.io.shell-extension.zip --force
gnome-extensions enable globalprotect@username.github.io
# Test functionality
gnome-extensions disable globalprotect@username.github.io
gnome-extensions uninstall globalprotect@username.github.io
```

---

## 🚀 Release Process

### 1. GitHub Release
- [ ] Create tag: `v1.2.1`
- [ ] Create release on GitHub
- [ ] Upload extension ZIP
- [ ] Write release notes
- [ ] Publish release

### 2. extensions.gnome.org Submission
- [ ] Login to extensions.gnome.org
- [ ] Upload extension ZIP
- [ ] Fill in description
- [ ] Add screenshots
- [ ] Submit for review

### 3. Post-Release
- [ ] Monitor for review feedback
- [ ] Respond to reviewer comments
- [ ] Update if requested
- [ ] Announce release

---

## 📝 Release Notes Template

```markdown
# GlobalProtect VPN Indicator v1.2.1

## What's New

### Improved
- **Import Certificate**: Interactive dialog with path input and validation
- **Disconnect**: Better status updates with multiple poll attempts
- **Resubmit HIP**: Improved error handling with retry logic

### Added
- File validation for certificate import
- Real-time feedback for validation errors
- Support for multiple certificate formats (.pem, .crt, .cer)
- Public `forceUpdate()` method in statusMonitor

### Fixed
- Certificate import now fully interactive
- Disconnect properly updates status
- HIP resubmission error handling

## Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## Installation

Download the extension from [extensions.gnome.org](https://extensions.gnome.org/) or install manually:

```bash
make install
```

## Requirements

- GNOME Shell 45-49
- GlobalProtect CLI installed

## Documentation

- [README.md](README.md) - User guide
- [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) - Testing guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guide
```

---

## 🧪 Final Testing

### Before Submission
- [ ] Fresh install test
- [ ] Enable/disable test
- [ ] All features test
- [ ] Error scenarios test
- [ ] Log verification
- [ ] Memory leak check

### Test Scenarios
1. **Install & Enable**
   - Install extension
   - Enable extension
   - Check panel icon appears
   - Check no errors in logs

2. **Connect/Disconnect**
   - Connect to VPN
   - Verify status updates
   - Disconnect from VPN
   - Verify clean disconnect

3. **Settings**
   - Open settings dialog
   - Change portal address
   - Change poll interval
   - Set username
   - Toggle SSL only
   - Change log level
   - Import certificate

4. **Gateway Switching**
   - Open gateway menu
   - Select different gateway
   - Verify switch successful

5. **Advanced Operations**
   - Rediscover network
   - Resubmit HIP
   - Collect logs
   - Report issue

6. **Disable & Uninstall**
   - Disable extension
   - Check clean disable
   - Uninstall extension
   - Verify complete removal

---

## 📊 Metrics

### Code Statistics
- JavaScript files: 6
- Lines of code: ~3,500
- Functions/Methods: 60+
- GSettings keys: 5

### Features
- Menu items: 20+
- Settings options: 7
- CLI commands: 15+
- Custom icons: 4

### Documentation
- Documentation files: 7
- Test scripts: 3
- Development docs: 40+

---

## ✅ Sign-Off

### Developer
- [x] Code complete
- [x] Tests passing
- [x] Documentation updated
- [x] Ready for release

**Signed**: Anton Isaiev  
**Date**: November 23, 2025

---

## 📞 Support

**Issues**: https://github.com/totoshko88/gp-gnome/issues  
**Email**: totoshko88@gmail.com  
**License**: GPL-3.0-or-later

---

**Status: READY FOR RELEASE** 🎉

