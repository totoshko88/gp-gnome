# Contributing to GNOME GlobalProtect Extension

Thank you for your interest in contributing to the GNOME GlobalProtect Extension! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions. We aim to create a welcoming environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check existing issues to avoid duplicates
2. Test with the latest version
3. Verify GlobalProtect CLI is working correctly

When creating a bug report, include:
- GNOME Shell version (`gnome-shell --version`)
- Extension version
- GlobalProtect CLI version (`globalprotect --version`)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages from logs (`journalctl -f -o cat /usr/bin/gnome-shell`)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please:
1. Check existing issues for similar requests
2. Clearly describe the feature and its benefits
3. Explain use cases
4. Consider implementation complexity

### Pull Requests

#### Before Starting

1. Open an issue to discuss major changes
2. Fork the repository
3. Create a feature branch from `main`

#### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/gnome-globalprotect-extension.git
cd gnome-globalprotect-extension

# Install the extension for development
make install

# Enable the extension
gnome-extensions enable globalprotect@username.github.io
```

#### Making Changes

1. **Follow the Architecture**
   - Maintain separation of concerns
   - Keep components modular
   - Use async operations for all subprocess calls

2. **Code Style**
   - Use 4 spaces for indentation
   - Follow existing code style
   - Use meaningful variable names
   - Add comments for complex logic
   - Run ESLint before committing: `npm run lint`
   - Fix linting issues: `npm run lint:fix`

3. **Testing**
   - Write unit tests for new functionality
   - Write property-based tests for universal properties
   - Ensure all existing tests pass
   - Test manually with real GlobalProtect CLI

4. **Documentation**
   - Update README.md if needed
   - Update CHANGELOG.md under `[Unreleased]`
   - Add JSDoc comments for new functions
   - Update design.md for architectural changes

#### Testing Your Changes

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run property-based tests only
make test-props

# Validate GNOME Extension Review Guidelines
bash tests/validate-review-guidelines.sh

# Test with real GlobalProtect CLI
bash tests/test-cli-integration.sh
```

#### Commit Guidelines

Use clear, descriptive commit messages:

```
Short summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

- Bullet points are okay
- Use present tense ("Add feature" not "Added feature")
- Reference issues: "Fixes #123" or "Related to #456"
```

Examples:
```
Add support for multiple portal configurations

Implement network rediscovery timeout handling

Fix status parsing for disconnected state

Update README with new installation instructions
```

#### Submitting Pull Request

1. **Prepare Your Branch**
   ```bash
   # Update your fork
   git fetch origin
   git rebase origin/main
   
   # Run tests
   make test
   ```

2. **Push to Your Fork**
   ```bash
   git push origin feature-branch-name
   ```

3. **Create Pull Request**
   - Go to GitHub and create a pull request
   - Fill in the PR template
   - Link related issues
   - Describe your changes clearly
   - Add screenshots for UI changes

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Property tests pass
   - [ ] Manual testing completed
   - [ ] Review guidelines validated
   
   ## Related Issues
   Fixes #123
   
   ## Screenshots (if applicable)
   ```

5. **Code Review**
   - Respond to review comments
   - Make requested changes
   - Push updates to the same branch
   - Be patient and respectful

## Development Guidelines

### Architecture Principles

1. **Separation of Concerns**
   - Each component has a single responsibility
   - Clear interfaces between components
   - Minimal coupling

2. **Async Operations**
   - All subprocess calls must be async
   - No blocking operations in main thread
   - Proper error handling for async operations

3. **Resource Management**
   - Create resources in `enable()`
   - Clean up resources in `disable()`
   - Disconnect all signals
   - Remove all timeouts

4. **Error Handling**
   - Catch all errors gracefully
   - Provide user-friendly error messages
   - Sanitize sensitive data in logs
   - Use ErrorHandler utility

### Code Organization

```
extension.js          # Main extension lifecycle
prefs.js             # Preferences UI (GTK allowed)
indicator.js         # System tray indicator
gpClient.js          # GlobalProtect CLI wrapper
statusMonitor.js     # Status polling
errorHandler.js      # Error handling utility
```

### Testing Requirements

1. **Unit Tests**
   - Test specific examples
   - Test edge cases
   - Test error conditions
   - Use Jasmine framework

2. **Property-Based Tests**
   - Test universal properties
   - Minimum 100 iterations
   - Use fast-check library
   - Tag with property number

3. **Integration Tests**
   - Test with real GlobalProtect CLI
   - Test MFA flow
   - Test all commands
   - Document in MANUAL_TESTING_GUIDE.md

### GNOME Extension Guidelines

Follow [GNOME Extension Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html):

1. **No Synchronous Operations**
   - Use async/await
   - Use Gio.Subprocess, not GLib.spawn_command_line_sync

2. **Proper Lifecycle**
   - Initialize in `enable()`
   - Clean up in `disable()`
   - No global state

3. **Import Restrictions**
   - No GTK in extension.js
   - No Shell in prefs.js
   - Use proper resource URIs

4. **Metadata**
   - Valid metadata.json
   - Correct shell-version
   - Proper UUID format

## Areas for Contribution

### High Priority

- [ ] Additional language translations
- [ ] Improved error messages
- [ ] Better MFA handling
- [ ] Connection statistics

### Medium Priority

- [ ] Multiple portal support
- [ ] Connection profiles
- [ ] Auto-connect on network change
- [ ] Certificate expiration warnings

### Low Priority

- [ ] Custom notification sounds
- [ ] Connection history
- [ ] Data usage tracking
- [ ] Theme customization

### Documentation

- [ ] Video tutorials
- [ ] More screenshots
- [ ] Troubleshooting guides
- [ ] FAQ section

### Testing

- [ ] More property-based tests
- [ ] Integration test automation
- [ ] Performance testing
- [ ] Compatibility testing with different GNOME versions

## Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue
- **Chat:** [Add chat link if available]
- **Email:** [Add email if available]

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- GitHub contributors page
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the GPL-2.0+ license.

## Review Process

1. **Initial Review:** Maintainer reviews PR within 1 week
2. **Feedback:** Maintainer provides feedback or requests changes
3. **Iteration:** Contributor addresses feedback
4. **Approval:** Maintainer approves PR
5. **Merge:** PR is merged to main branch
6. **Release:** Changes included in next release

## Questions?

Don't hesitate to ask questions! Open an issue or discussion if anything is unclear.

Thank you for contributing! 🎉
