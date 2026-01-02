---
inclusion: always
---

# Project Structure

## Core Modules

| File | Purpose | Key Patterns |
|------|---------|--------------|
| `extension.js` | Lifecycle management (`enable`/`disable`) | Creates all components in `enable()`, destroys in `disable()`. Auto-disconnects VPN on disable. |
| `indicator.js` | Panel UI (GObject.registerClass) | Extends `PanelMenu.Button`. Manages menu, dialogs, state transitions. |
| `gpClient.js` | CLI wrapper (async subprocess) | Uses `Gio.Subprocess` with timeouts and cancellation. Implements retry logic. |
| `statusMonitor.js` | Polling service (GObject signals) | Emits `status-changed` signal. Debounces disconnect events. |
| `errorHandler.js` | Error handling utility | Static methods. Sanitizes sensitive data. Maps errors to user messages. |
| `prefs.js` | Preferences UI | GTK allowed here only. Opens via GNOME Extensions app. |

## Architecture Rules

1. **No GTK in extension.js** - GTK imports only allowed in `prefs.js`
2. **No global state** - All state lives in extension instance, created in `enable()`, destroyed in `disable()`
3. **All CLI operations async** - Use `Gio.Subprocess` with `communicate_utf8_async`, never blocking calls
4. **Signal cleanup required** - Track all signal connections and disconnect in `destroy()`
5. **Timeout cleanup required** - Track all `GLib.timeout_add` IDs and remove in `destroy()`

## Component Dependencies

```
Extension
├── creates → GlobalProtectClient (gpClient.js)
├── creates → StatusMonitor (statusMonitor.js)
└── creates → GlobalProtectIndicator (indicator.js)
                ├── uses → GlobalProtectClient
                ├── uses → StatusMonitor
                └── uses → ErrorHandler (static)
```

## Configuration

- `schemas/org.gnome.shell.extensions.gp-gnome.gschema.xml` - GSettings schema
- `metadata.json` - Extension UUID, version, GNOME Shell compatibility

## Assets

- `icons/*.svg` - State icons: `on.svg`, `off.svg`, `connecting.svg`, `error.svg`
- `stylesheet.css` - UI styling classes

## Testing

- `tests/run-unit-tests.js` - Unit test runner (Jasmine)
- `tests/run-property-tests.js` - Property-based tests (fast-check)
- `tests/properties/` - Property-based test specs
- `tests/mocks/gnome-mocks.js` - GNOME API mocks for testing outside Shell
- `tests/*.sh` - Integration/validation shell scripts

## Code Conventions

- Use `console.info()` for debug logging with `gp-gnome:` prefix
- Use `console.error()` for errors
- Prefix private methods with `_`
- Track timeouts in `Set` for cleanup: `this._timeoutIds`
- Track signals in array for cleanup: `this._signalIds`
- Check `this._isDestroyed` before async callback execution
