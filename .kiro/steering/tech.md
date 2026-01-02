---
inclusion: always
---

# Technology Stack

## Platform Requirements

- GNOME Shell: 45, 46, 47, 48, 49
- Language: JavaScript (GJS - GNOME JavaScript bindings)
- Runtime: GJS (GNOME JavaScript runtime)
- Extension UUID: `gp-gnome@totoshko88.github.io`

## Core Libraries

| Library | Usage |
|---------|-------|
| GJS/GObject | Extension class registration, signal handling |
| Gio | Async subprocess (`Gio.Subprocess`), file I/O, cancellables |
| GLib | Timeouts (`GLib.timeout_add`), event loop, utilities |
| GSettings | User preferences via compiled GSchema |

## GJS Code Conventions

- Use ES modules with `import` statements (not `require`)
- Import GNOME libraries: `import Gio from 'gi://Gio'`
- Import extension resources: `import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js'`
- Register classes with `GObject.registerClass()` for Shell integration
- Use `console.info()` / `console.error()` for logging (prefix: `gp-gnome:`)

## Async Patterns

- All subprocess calls MUST use `Gio.Subprocess` with `communicate_utf8_async`
- Never use blocking/synchronous subprocess calls
- Always implement timeout handling with `GLib.timeout_add`
- Use cancellables (`Gio.Cancellable`) for long-running operations

## Testing

| Type | Framework | Command |
|------|-----------|---------|
| Unit | Jasmine | `make test-unit` or `npm run test:unit` |
| Property-based | fast-check + Jasmine | `make test-props` or `npm run test:properties` |
| All tests | - | `make test` or `npm test` |
| Linting | ESLint | `npm run lint` |

## Build Commands

```bash
make install      # Install to ~/.local/share/gnome-shell/extensions/
make uninstall    # Remove extension
make dist         # Create zip for distribution
make clean        # Remove build artifacts
```

## Dependencies

- GlobalProtect CLI at `/usr/bin/globalprotect` or `/opt/paloaltonetworks/globalprotect/globalprotect`
- `glib-compile-schemas` for GSettings compilation
- `zip` for distribution packages
- Node.js + npm for test dependencies

## Debugging

```bash
# View extension logs (filter by extension name)
journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect

# Enable extension
gnome-extensions enable gp-gnome@totoshko88.github.io

# Restart GNOME Shell (X11 only): Alt+F2 → 'r' → Enter
# Wayland: Log out and back in
```
