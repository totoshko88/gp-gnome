# Distribution Guide

## Creating a Release

### 1. Update Version

```bash
# Update metadata.json version number
# Update CHANGELOG.md with changes
```

### 2. Build Package

```bash
make dist
# Creates: dist/gp-gnome@totoshko88.github.io.zip
```

### 3. Create Git Tag

```bash
git add -A
git commit -m "release: vX.Y.Z"
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

GitHub Actions will automatically create a release with notes from CHANGELOG.md.

## Manual Release (if needed)

1. Go to GitHub → Releases → Create new release
2. Select tag
3. Upload `dist/gp-gnome@totoshko88.github.io.zip`
4. Copy relevant section from CHANGELOG.md

## extensions.gnome.org Submission

### Prerequisites

- Account on https://extensions.gnome.org
- Pass validation: `bash tests/validate-review-guidelines.sh`

### Submit

1. Log in to extensions.gnome.org
2. Click "Upload Extension"
3. Upload the zip file
4. Fill in details and submit

### Common Review Issues

| Issue | Solution |
|-------|----------|
| Sync operations | Use async/await |
| Resource leaks | Clean up in `disable()` |
| GTK in extension.js | Move to prefs.js |
| Missing error handling | Add try/catch |

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (X.0.0): Breaking changes
- **Minor** (1.X.0): New features
- **Patch** (1.0.X): Bug fixes

## Pre-Release Checklist

- [ ] All tests pass (`make test`)
- [ ] EGO guidelines validated
- [ ] CHANGELOG.md updated
- [ ] metadata.json version updated
- [ ] README.md version badge updated
