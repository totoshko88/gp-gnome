# Contributing

Thank you for your interest in contributing!

## Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR-USERNAME/gp-gnome.git
cd gp-gnome

# Install for development
make install
gnome-extensions enable gp-gnome@totoshko88.github.io

# Run tests
make test
```

## Guidelines

### Code Style

- 4 spaces indentation
- JSDoc comments for functions
- Run `npm run lint` before committing

### Architecture

| File | Purpose |
|------|---------|
| `extension.js` | Lifecycle management |
| `indicator.js` | UI component |
| `gpClient.js` | CLI wrapper (async) |
| `statusMonitor.js` | Status polling |
| `errorHandler.js` | Error handling |

### Key Principles

- All subprocess calls must be async
- Clean up resources in `disable()`
- No GTK imports in `extension.js`
- Follow [EGO Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html)

## Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Run `make test`
4. Submit PR with description

### Commit Format

```
Short summary (50 chars)

Detailed explanation if needed.
- Use present tense
- Reference issues: "Fixes #123"
```

## Testing

```bash
make test              # All tests
make test-unit         # Unit tests only
make test-props        # Property tests only
```

## Areas for Contribution

- 🌍 Translations
- 📝 Documentation
- 🐛 Bug fixes
- ✨ New features (discuss first)

## Questions?

Open an issue or email totoshko88@gmail.com

---

By contributing, you agree to license your work under GPL-3.0-or-later.
