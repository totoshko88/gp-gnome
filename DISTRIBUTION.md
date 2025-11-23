# Distribution Guide

This document provides instructions for preparing and distributing the GNOME GlobalProtect Extension.

## Pre-Distribution Checklist

Before creating a release, ensure:

- [ ] All tests pass (unit tests and property-based tests)
- [ ] Extension follows GNOME Extension Review Guidelines
- [ ] README.md is up to date
- [ ] CHANGELOG.md is updated with version changes
- [ ] metadata.json has correct version number
- [ ] All code is properly documented
- [ ] No sensitive information in code or configuration
- [ ] Icons are properly licensed and attributed
- [ ] License file is included (GPL-2.0+)

## Creating a Distribution Package

### Using Make

```bash
# Create a distribution package
make dist
```

This will create a `dist/globalprotect@username.github.io.zip` file ready for distribution.

### Manual Packaging

```bash
# Create build directory
mkdir -p build/globalprotect@username.github.io

# Copy extension files
cp extension.js prefs.js indicator.js gpClient.js statusMonitor.js errorHandler.js \
   metadata.json stylesheet.css build/globalprotect@username.github.io/

# Copy schemas
mkdir -p build/globalprotect@username.github.io/schemas
cp schemas/org.gnome.shell.extensions.globalprotect.gschema.xml \
   build/globalprotect@username.github.io/schemas/

# Copy icons
mkdir -p build/globalprotect@username.github.io/icons
cp icons/*.png build/globalprotect@username.github.io/icons/

# Compile schemas
glib-compile-schemas build/globalprotect@username.github.io/schemas/

# Create zip package
cd build
zip -r ../globalprotect@username.github.io.zip globalprotect@username.github.io
cd ..
```

## GitHub Release Process

### 1. Prepare the Release

```bash
# Ensure you're on the main branch
git checkout main

# Update version in metadata.json
# Update CHANGELOG.md

# Commit changes
git add metadata.json CHANGELOG.md
git commit -m "Prepare for version 1.0.0 release"

# Create and push tag
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin main
git push origin v1.0.0
```

### 2. Create Distribution Package

```bash
make dist
```

### 3. Create GitHub Release

1. Go to your GitHub repository
2. Click on "Releases" → "Create a new release"
3. Select the tag you just created (v1.0.0)
4. Fill in the release information:

**Release Title:** `GNOME GlobalProtect Extension v1.0.0`

**Release Description:**
```markdown
# GNOME GlobalProtect Extension v1.0.0

A GNOME Shell extension for managing GlobalProtect VPN connections.

## Features

- 🔒 Connect/disconnect from GlobalProtect VPN
- 📊 Real-time status monitoring
- 🔐 MFA authentication support
- ⚙️ Configurable portal address
- 🛠️ Advanced operations (network rediscovery, HIP resubmission, log collection)

## Installation

Download the `globalprotect@username.github.io.zip` file and install using:

```bash
gnome-extensions install globalprotect@username.github.io.zip
gnome-extensions enable globalprotect@username.github.io
```

Or use the installation script from the source repository.

## Requirements

- GNOME Shell 49 or compatible
- GlobalProtect CLI installed

## What's New in v1.0.0

- Initial release
- Full GlobalProtect CLI integration
- MFA authentication support
- Custom icons for connection states
- Comprehensive error handling
- Property-based and unit test coverage

## Documentation

See [README.md](https://github.com/username/gnome-globalprotect-extension/blob/main/README.md) for full documentation.

## Known Issues

None at this time.

## Support

For issues or questions, please open an issue on GitHub.
```

4. Upload the distribution package: `dist/globalprotect@username.github.io.zip`
5. Mark as "Latest release"
6. Publish the release

## extensions.gnome.org Submission

### Prerequisites

1. Create an account on https://extensions.gnome.org
2. Verify your email address
3. Read the review guidelines: https://gjs.guide/extensions/review-guidelines/review-guidelines.html

### Submission Process

1. **Validate Extension**

Run the validation script:
```bash
bash tests/validate-review-guidelines.sh
```

Ensure all checks pass.

2. **Prepare Submission Package**

Create a clean distribution package:
```bash
make dist
```

3. **Submit to extensions.gnome.org**

- Log in to https://extensions.gnome.org
- Click "Upload Extension"
- Upload the `dist/globalprotect@username.github.io.zip` file
- Fill in the extension information:
  - **Name:** GNOME GlobalProtect Extension
  - **Description:** Manage GlobalProtect VPN connections from GNOME Shell
  - **URL:** https://github.com/username/gnome-globalprotect-extension
  - **Shell Versions:** 49
  - **Screenshot:** Upload screenshots from docs/screenshots/

4. **Wait for Review**

The extension will be reviewed by GNOME maintainers. This can take several days to weeks.

5. **Respond to Review Feedback**

If reviewers request changes:
- Make the requested changes
- Test thoroughly
- Create a new version
- Re-upload the extension

### Common Review Issues

- **Synchronous Operations:** Ensure all operations are async
- **Resource Cleanup:** Verify proper cleanup in disable()
- **GTK in extension.js:** Don't import GTK in extension code
- **Shell in prefs.js:** Don't import Shell in preferences
- **Error Handling:** Proper error handling for all operations
- **Metadata:** Valid and complete metadata.json

## Version Numbering

Follow semantic versioning (SEMVER):

- **Major (X.0.0):** Breaking changes
- **Minor (1.X.0):** New features, backward compatible
- **Patch (1.0.X):** Bug fixes, backward compatible

## Changelog Format

Keep CHANGELOG.md updated with each release:

```markdown
# Changelog

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Connect/disconnect functionality
- MFA authentication support
- Status monitoring
- Advanced operations

### Changed
- N/A

### Fixed
- N/A

### Security
- Sensitive data sanitization in logs
```

## Post-Release

After releasing:

1. **Announce the Release**
   - Post on relevant forums/communities
   - Update project website if applicable
   - Share on social media

2. **Monitor Issues**
   - Watch GitHub issues
   - Respond to user feedback
   - Track bug reports

3. **Plan Next Release**
   - Review feature requests
   - Prioritize bug fixes
   - Update roadmap

## Support Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and discussions
- **Email:** For security issues or private concerns

## License Compliance

Ensure all distributed files comply with GPL-2.0+:

- Include LICENSE file
- Add license headers to source files
- Attribute third-party code/assets
- Document dependencies and their licenses

## Testing Before Release

Always run the full test suite before releasing:

```bash
# Run all tests
make test

# Validate review guidelines
bash tests/validate-review-guidelines.sh

# Test CLI integration (requires GlobalProtect)
bash tests/test-cli-integration.sh

# Manual testing
# - Install extension
# - Test all features
# - Test error scenarios
# - Test on clean GNOME installation
```

## Distribution Channels

1. **GitHub Releases** (Primary)
   - Source code
   - Pre-built packages
   - Release notes

2. **extensions.gnome.org** (Official)
   - Discoverable by GNOME users
   - Automatic updates
   - Official GNOME platform

3. **Package Repositories** (Future)
   - AUR (Arch User Repository)
   - Fedora COPR
   - Ubuntu PPA

## Maintenance

Regular maintenance tasks:

- Update for new GNOME Shell versions
- Security updates
- Bug fixes
- Feature enhancements
- Documentation updates
- Test suite maintenance

## Deprecation Policy

If features need to be deprecated:

1. Announce deprecation in release notes
2. Provide migration path
3. Keep deprecated features for at least one major version
4. Remove in next major version

## Contact

For distribution-related questions:
- Open an issue on GitHub
- Email: [your-email@example.com]
