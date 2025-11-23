# GitHub Repository Setup Guide

This guide walks you through setting up the GitHub repository for the GNOME GlobalProtect Extension.

## Prerequisites

- Git installed on your system
- GitHub account created
- GlobalProtect extension code ready

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in repository details:
   - **Repository name:** `gnome-globalprotect-extension`
   - **Description:** "A GNOME Shell extension for managing GlobalProtect VPN connections"
   - **Visibility:** Public (for extensions.gnome.org submission)
   - **Initialize:** Do NOT initialize with README (we already have one)
3. Click "Create repository"

## Step 2: Update Extension UUID

Before pushing to GitHub, update the extension UUID in the following files:

1. **metadata.json**
   ```json
   {
     "uuid": "globalprotect@your-github-username.github.io",
     ...
   }
   ```

2. **install.sh** - Update `EXTENSION_UUID` variable
3. **uninstall.sh** - Update `EXTENSION_UUID` variable
4. **Makefile** - Update `EXTENSION_UUID` variable
5. **All documentation** - Replace `username` with your GitHub username

## Step 3: Initialize Git Repository

```bash
# Navigate to your extension directory
cd /path/to/gnome-globalprotect-extension

# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: GNOME GlobalProtect Extension v1.0.0"

# Add remote repository (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/gnome-globalprotect-extension.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Configure Repository Settings

### General Settings

1. Go to repository Settings → General
2. Enable "Issues" for bug tracking
3. Enable "Discussions" for community questions
4. Disable "Wikis" (use README instead)
5. Disable "Projects" (unless you want to use them)

### Branch Protection

1. Go to Settings → Branches
2. Add branch protection rule for `main`:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators (optional)

### Topics

1. Go to repository main page
2. Click the gear icon next to "About"
3. Add topics:
   - `gnome-shell`
   - `gnome-extension`
   - `globalprotect`
   - `vpn`
   - `linux`
   - `gnome`
   - `gjs`

### Description and Website

1. Click the gear icon next to "About"
2. Add description: "A GNOME Shell extension for managing GlobalProtect VPN connections"
3. Add website: Your project website or GitHub Pages URL (optional)

## Step 5: Set Up GitHub Actions

GitHub Actions workflows are already included in `.github/workflows/`:
- `ci.yml` - Continuous Integration (runs on push and PR)
- `release.yml` - Automated releases (runs on version tags)

No additional setup needed - they will run automatically.

## Step 6: Create Initial Release

### Option A: Using GitHub Web Interface

1. Go to repository → Releases → "Create a new release"
2. Click "Choose a tag" → Type `v1.0.0` → "Create new tag"
3. Release title: `GNOME GlobalProtect Extension v1.0.0`
4. Description: Copy from CHANGELOG.md
5. Upload `dist/globalprotect@your-username.github.io.zip`
6. Click "Publish release"

### Option B: Using Git Tags

```bash
# Create distribution package
make dist

# Create and push tag
git tag -a v1.0.0 -m "Version 1.0.0 - Initial release"
git push origin v1.0.0

# GitHub Actions will automatically create the release
# Then manually upload the zip file to the release
```

## Step 7: Set Up GitHub Pages (Optional)

If you want a project website:

1. Create a `docs` directory
2. Add an `index.html` or `index.md`
3. Go to Settings → Pages
4. Source: Deploy from a branch
5. Branch: `main`, folder: `/docs`
6. Save

## Step 8: Configure Issue Templates

Issue templates are already included in `.github/ISSUE_TEMPLATE/`:
- `bug_report.md`
- `feature_request.md`

They will appear automatically when users create issues.

## Step 9: Add Repository Badges

Add badges to README.md (at the top):

```markdown
# GNOME GlobalProtect Extension

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-49-blue.svg)](https://www.gnome.org/)
[![GitHub release](https://img.shields.io/github/release/YOUR-USERNAME/gnome-globalprotect-extension.svg)](https://github.com/YOUR-USERNAME/gnome-globalprotect-extension/releases)
[![CI](https://github.com/YOUR-USERNAME/gnome-globalprotect-extension/workflows/CI/badge.svg)](https://github.com/YOUR-USERNAME/gnome-globalprotect-extension/actions)
```

## Step 10: Submit to extensions.gnome.org

1. Create account on https://extensions.gnome.org
2. Verify email
3. Go to "Upload Extension"
4. Upload `dist/globalprotect@your-username.github.io.zip`
5. Fill in extension information:
   - Name: GNOME GlobalProtect Extension
   - Description: Manage GlobalProtect VPN connections from GNOME Shell
   - URL: https://github.com/YOUR-USERNAME/gnome-globalprotect-extension
   - Shell Versions: 49
6. Upload screenshots
7. Submit for review

## Step 11: Promote Your Extension

### Community Channels

- Reddit: r/gnome, r/linux
- GNOME Discourse: https://discourse.gnome.org/
- Twitter/X: Use hashtags #GNOME #Linux #VPN
- Hacker News: https://news.ycombinator.com/

### Blog Post

Write a blog post about:
- Why you created the extension
- Key features
- Installation instructions
- Screenshots/demo
- Link to GitHub repository

### Documentation

- Add screenshots to `docs/screenshots/`
- Create video tutorial (optional)
- Write FAQ section
- Add troubleshooting guides

## Maintenance

### Regular Tasks

1. **Monitor Issues**
   - Respond to bug reports
   - Answer questions
   - Label and prioritize issues

2. **Review Pull Requests**
   - Test changes locally
   - Provide constructive feedback
   - Merge approved PRs

3. **Update Dependencies**
   - Keep up with GNOME Shell updates
   - Test with new GNOME versions
   - Update compatibility in metadata.json

4. **Release Updates**
   - Follow semantic versioning
   - Update CHANGELOG.md
   - Create release notes
   - Tag versions

### Security

1. Enable Dependabot (if using npm):
   - Settings → Security → Dependabot alerts
   - Enable vulnerability alerts

2. Monitor security advisories:
   - GitHub Security tab
   - GNOME security announcements

3. Respond to security issues:
   - Create private security advisory
   - Fix vulnerability
   - Release security update
   - Disclose responsibly

## Troubleshooting

### Push Rejected

```bash
# If push is rejected, pull first
git pull origin main --rebase
git push origin main
```

### Large Files

If you accidentally committed large files:

```bash
# Remove from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/large/file' \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

### Wrong Commit Message

```bash
# Amend last commit message
git commit --amend -m "New commit message"
git push --force origin main
```

## Resources

- [GitHub Docs](https://docs.github.com/)
- [GNOME Extension Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Support

If you need help with GitHub setup:
- GitHub Community Forum: https://github.community/
- GitHub Support: https://support.github.com/

## Next Steps

After completing this setup:

1. ✅ Repository created and configured
2. ✅ Code pushed to GitHub
3. ✅ Initial release published
4. ✅ Submitted to extensions.gnome.org
5. ✅ Community promotion started

Your extension is now ready for the world! 🎉
