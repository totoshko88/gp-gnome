# Design Document

## Overview

GNOME GlobalProtect Extension - це розширення для GNOME Shell 49, яке надає графічний інтерфейс для управління GlobalProtect VPN CLI. Extension інтегрується в системний трей GNOME, відображає поточний стан VPN з'єднання та дозволяє користувачам підключатися/відключатися від VPN без використання командного рядка.

Архітектура extension побудована відповідно до GNOME Extension Review Guidelines, використовує асинхронні операції для виконання команд через Gio.Subprocess та забезпечує коректне управління ресурсами через lifecycle методи enable()/disable().

## Architecture

Extension складається з наступних основних компонентів:

```
gnome-globalprotect-extension/
├── extension.js          # Головний файл extension (Extension class)
├── prefs.js             # Preferences UI
├── indicator.js         # Status indicator в системному треї
├── gpClient.js          # GlobalProtect CLI wrapper
├── statusMonitor.js     # Моніторинг стану VPN
├── metadata.json        # Extension metadata
├── schemas/
│   └── org.gnome.shell.extensions.globalprotect.gschema.xml
└── stylesheet.css       # Стилі для UI
```

### Архітектурні принципи:

1. **Separation of Concerns**: Кожен компонент має чітко визначену відповідальність
2. **Asynchronous Operations**: Всі операції з subprocess виконуються асинхронно
3. **Resource Management**: Всі ресурси створюються в enable() та знищуються в disable()
4. **Error Handling**: Всі помилки обробляються gracefully з відповідними повідомленнями користувачу

## Components and Interfaces

### 1. Extension Class (extension.js)

Головний клас extension, який управляє lifecycle та координує роботу інших компонентів.

```javascript
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class GlobalProtectExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
        this._gpClient = null;
        this._statusMonitor = null;
    }

    enable() {
        // Створення всіх компонентів
        this._settings = this.getSettings();
        this._gpClient = new GlobalProtectClient(this._settings);
        this._statusMonitor = new StatusMonitor(this._gpClient);
        this._indicator = new GlobalProtectIndicator(
            this._gpClient,
            this._statusMonitor,
            this._settings
        );
        
        // Додавання indicator до панелі
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        // Запуск моніторингу
        this._statusMonitor.start();
    }

    disable() {
        // Зупинка моніторингу
        this._statusMonitor?.stop();
        this._statusMonitor = null;
        
        // Видалення indicator
        this._indicator?.destroy();
        this._indicator = null;
        
        // Очищення клієнта
        this._gpClient = null;
        
        // Очищення settings
        this._settings = null;
    }
}
```

### 2. GlobalProtect Client (gpClient.js)

Wrapper для виконання команд GlobalProtect CLI через Gio.Subprocess.

```javascript
export class GlobalProtectClient {
    constructor(settings) {
        this._settings = settings;
    }

    async connect(portal) {
        // Виконує: globalprotect connect --portal <portal>
        const proc = new Gio.Subprocess({
            argv: ['globalprotect', 'connect', '--portal', portal],
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        });
        
        proc.init(null);
        const [stdout, stderr] = await proc.communicate_utf8_async(null, null);
        
        if (!proc.get_successful()) {
            throw new Error(stderr || 'Connection failed');
        }
        
        return stdout;
    }

    async disconnect() {
        // Виконує: globalprotect disconnect
    }

    async getStatus() {
        // Виконує: globalprotect show --status
        // Повертає: { connected: boolean, portal: string, gateway: string }
    }

    async getDetails() {
        // Виконує: globalprotect show --details
    }

    async rediscoverNetwork() {
        // Виконує: globalprotect rediscover-network
    }

    async resubmitHip() {
        // Виконує: globalprotect resubmit-hip
    }

    async collectLog() {
        // Виконує: globalprotect collect-log
    }
}
```

### 3. Status Monitor (statusMonitor.js)

Компонент для періодичного моніторингу стану VPN з'єднання.

```javascript
export class StatusMonitor extends GObject.Object {
    static {
        GObject.registerClass({
            Signals: {
                'status-changed': {
                    param_types: [GObject.TYPE_JSOBJECT]
                }
            }
        }, this);
    }

    constructor(gpClient) {
        super();
        this._gpClient = gpClient;
        this._timeoutId = null;
        this._currentStatus = null;
        this._pollInterval = 5000; // 5 секунд
    }

    start() {
        if (this._timeoutId) return;
        
        this._poll();
        this._timeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this._pollInterval,
            () => {
                this._poll();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    stop() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
    }

    async _poll() {
        try {
            const status = await this._gpClient.getStatus();
            
            if (JSON.stringify(status) !== JSON.stringify(this._currentStatus)) {
                this._currentStatus = status;
                this.emit('status-changed', status);
            }
        } catch (e) {
            logError(e, 'Failed to poll VPN status');
        }
    }

    getCurrentStatus() {
        return this._currentStatus;
    }
}
```

### 4. Status Indicator (indicator.js)

UI компонент в системному треї для відображення стану та управління VPN.

```javascript
export const GlobalProtectIndicator = GObject.registerClass(
class GlobalProtectIndicator extends PanelMenu.Button {
    _init(gpClient, statusMonitor, settings) {
        super._init(0.0, 'GlobalProtect Indicator');
        
        this._gpClient = gpClient;
        this._statusMonitor = statusMonitor;
        this._settings = settings;
        
        // Створення іконки
        this._icon = new St.Icon({
            icon_name: 'network-vpn-disconnected-symbolic',
            style_class: 'system-status-icon'
        });
        this.add_child(this._icon);
        
        // Створення меню
        this._buildMenu();
        
        // Підписка на зміни статусу
        this._statusChangedId = this._statusMonitor.connect(
            'status-changed',
            this._onStatusChanged.bind(this)
        );
        
        // Початкове оновлення
        this._updateIcon(this._statusMonitor.getCurrentStatus());
    }

    _buildMenu() {
        // Status section
        this._statusLabel = new St.Label({ text: 'Not connected' });
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(this._statusLabel, {
            reactive: false
        }));
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        // Connect/Disconnect button
        this._toggleItem = new PopupMenu.PopupMenuItem('Connect');
        this._toggleItem.connect('activate', this._onToggleConnection.bind(this));
        this.menu.addMenuItem(this._toggleItem);
        
        // Advanced submenu
        const advancedMenu = new PopupMenu.PopupSubMenuMenuItem('Advanced');
        
        const rediscoverItem = new PopupMenu.PopupMenuItem('Rediscover Network');
        rediscoverItem.connect('activate', () => this._executeCommand('rediscoverNetwork'));
        advancedMenu.menu.addMenuItem(rediscoverItem);
        
        const resubmitHipItem = new PopupMenu.PopupMenuItem('Resubmit HIP');
        resubmitHipItem.connect('activate', () => this._executeCommand('resubmitHip'));
        advancedMenu.menu.addMenuItem(resubmitHipItem);
        
        const collectLogItem = new PopupMenu.PopupMenuItem('Collect Logs');
        collectLogItem.connect('activate', () => this._executeCommand('collectLog'));
        advancedMenu.menu.addMenuItem(collectLogItem);
        
        this.menu.addMenuItem(advancedMenu);
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        // Settings
        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => {
            ExtensionUtils.openPrefs();
        });
        this.menu.addMenuItem(settingsItem);
    }

    _onStatusChanged(monitor, status) {
        this._updateIcon(status);
        this._updateMenu(status);
    }

    _updateIcon(status) {
        if (status?.connected) {
            this._icon.icon_name = 'network-vpn-symbolic';
        } else {
            this._icon.icon_name = 'network-vpn-disconnected-symbolic';
        }
    }

    _updateMenu(status) {
        if (status?.connected) {
            this._statusLabel.text = `Connected to ${status.portal}`;
            this._toggleItem.label.text = 'Disconnect';
        } else {
            this._statusLabel.text = 'Not connected';
            this._toggleItem.label.text = 'Connect';
        }
    }

    async _onToggleConnection() {
        const status = this._statusMonitor.getCurrentStatus();
        
        try {
            if (status?.connected) {
                await this._gpClient.disconnect();
                Main.notify('GlobalProtect', 'Disconnected from VPN');
            } else {
                const portal = this._settings.get_string('portal-address');
                await this._gpClient.connect(portal);
                Main.notify('GlobalProtect', 'Connected to VPN');
            }
        } catch (e) {
            Main.notifyError('GlobalProtect Error', e.message);
            logError(e);
        }
    }

    async _executeCommand(commandName) {
        try {
            await this._gpClient[commandName]();
            Main.notify('GlobalProtect', `${commandName} completed successfully`);
        } catch (e) {
            Main.notifyError('GlobalProtect Error', e.message);
            logError(e);
        }
    }

    destroy() {
        if (this._statusChangedId) {
            this._statusMonitor.disconnect(this._statusChangedId);
            this._statusChangedId = null;
        }
        
        super.destroy();
    }
});
```

### 5. Preferences (prefs.js)

UI для налаштування extension.

```javascript
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class GlobalProtectPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Connection Settings',
            description: 'Configure GlobalProtect VPN connection'
        });
        
        // Portal address
        const portalRow = new Adw.EntryRow({
            title: 'Portal Address',
            text: this.getSettings().get_string('portal-address')
        });
        
        portalRow.connect('changed', (widget) => {
            this.getSettings().set_string('portal-address', widget.text);
        });
        
        group.add(portalRow);
        page.add(group);
        window.add(page);
    }
}
```

## Data Models

### VPN Status Object

```javascript
{
    connected: boolean,      // Чи активне з'єднання
    portal: string,          // Адреса порталу (якщо підключено)
    gateway: string,         // Адреса gateway (якщо підключено)
    username: string,        // Ім'я користувача (якщо доступно)
    clientIp: string,        // IP адреса клієнта (якщо доступно)
    vpnIp: string           // VPN IP адреса (якщо доступно)
}
```

### Settings Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<schemalist>
  <schema id="org.gnome.shell.extensions.globalprotect" 
          path="/org/gnome/shell/extensions/globalprotect/">
    <key name="portal-address" type="s">
      <default>'vpn.epam.com'</default>
      <summary>VPN Portal Address</summary>
      <description>
        The address of the GlobalProtect VPN portal to connect to
      </description>
    </key>
    <key name="poll-interval" type="i">
      <default>5</default>
      <range min="3" max="60"/>
      <summary>Status Poll Interval</summary>
      <description>
        How often to check VPN connection status (in seconds)
      </description>
    </key>
  </schema>
</schemalist>
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Після аналізу всіх testable criteria, я виявив наступні можливості для консолідації:

- Properties 2.1 та 2.2 (icon display based on connection state) можуть бути об'єднані в одну property про відповідність іконки стану
- Properties 3.4 та 4.4 (error notifications) можуть бути об'єднані в загальну property про error handling
- Properties 3.5 та 4.5 (state transitions) можуть бути об'єднані в property про коректність state transitions
- Property 1.3 покривається property 1.2 (round-trip)
- Багато "example" testable criteria будуть покриті unit tests, а не property tests

### Properties

Property 1: Settings persistence round-trip
*For any* valid portal address string, saving it to settings and then loading settings should return the same portal address
**Validates: Requirements 1.2, 1.3**

Property 2: Portal address validation
*For any* input string, the validation function should accept valid domain names/IPs and reject invalid formats
**Validates: Requirements 1.4**

Property 3: Icon reflects connection state
*For any* VPN connection state (connected/disconnected), the displayed icon name should correctly correspond to that state (network-vpn-symbolic for connected, network-vpn-disconnected-symbolic for disconnected)
**Validates: Requirements 2.1, 2.2**

Property 4: Status parsing completeness
*For any* valid GlobalProtect status output, the parser should extract all available fields (connection status, portal, gateway, IPs) without data loss
**Validates: Requirements 2.4**

Property 5: Connect command includes portal
*For any* configured portal address, executing connect should invoke globalprotect with that exact portal parameter
**Validates: Requirements 3.2**

Property 6: Error handling produces notifications
*For any* failed operation (connect, disconnect, advanced commands), the system should display an error notification to the user
**Validates: Requirements 3.4, 4.4, 9.3**

Property 7: State transitions are consistent
*For any* successful operation (connect/disconnect), the system state should transition to the corresponding state (connected after connect, disconnected after disconnect)
**Validates: Requirements 3.5, 4.5**

Property 8: Connection details include required fields
*For any* connected VPN session, the displayed connection information should include status, portal, and gateway fields
**Validates: Requirements 5.4**

Property 9: Advanced commands produce notifications
*For any* completed advanced command (rediscover-network, resubmit-hip, collect-log), the system should display a notification with the result
**Validates: Requirements 6.5**

Property 10: Subprocess output stream separation
*For any* subprocess execution, stdout and stderr should be captured and parsed separately without mixing the streams
**Validates: Requirements 9.4**

Property 11: Resource cleanup completeness
*For any* resources created during enable() (signals, timeouts, objects), all should be properly destroyed/disconnected in disable()
**Validates: Requirements 10.3**

Property 12: Command availability verification
*For any* external command execution, the system should verify the command exists before attempting to execute it
**Validates: Requirements 10.4**

Property 13: Error logging sanitization
*For any* error that occurs, logged error messages should not contain sensitive information (passwords, tokens, personal data)
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Subprocess Execution Errors**
   - Command not found (globalprotect not installed)
   - Command execution timeout
   - Command returns non-zero exit code
   - Permission denied

2. **Connection Errors**
   - Portal unreachable
   - Authentication failure
   - MFA timeout
   - Network errors

3. **Configuration Errors**
   - Invalid portal address format
   - Missing required settings
   - Schema validation errors

4. **Resource Errors**
   - Failed to create UI elements
   - Failed to connect signals
   - Memory allocation failures

### Error Handling Strategy

```javascript
class ErrorHandler {
    static handle(error, context) {
        // Log error (sanitized)
        logError(error, context);
        
        // Determine error type and user message
        const userMessage = this._getUserMessage(error);
        
        // Show notification
        Main.notifyError('GlobalProtect Error', userMessage);
        
        // Update UI state if needed
        this._updateUIForError(context);
    }
    
    static _getUserMessage(error) {
        if (error.message.includes('command not found')) {
            return 'GlobalProtect CLI is not installed';
        }
        if (error.message.includes('timeout')) {
            return 'Operation timed out. Please try again.';
        }
        if (error.message.includes('authentication')) {
            return 'Authentication failed. Please check your credentials.';
        }
        // Generic fallback
        return 'An error occurred. Check logs for details.';
    }
    
    static _sanitizeForLog(message) {
        // Remove potential sensitive data
        return message
            .replace(/password[=:]\s*\S+/gi, 'password=***')
            .replace(/token[=:]\s*\S+/gi, 'token=***')
            .replace(/cookie[=:]\s*\S+/gi, 'cookie=***');
    }
}
```

### Timeout Configuration

- **Status queries**: 5 seconds
- **Connect/Disconnect**: 30 seconds (to allow for MFA)
- **Advanced commands**: 10 seconds
- **Log collection**: 60 seconds (може бути великий обсяг даних)

## Testing Strategy

### Unit Testing

Extension буде тестуватися за допомогою unit tests для перевірки конкретних прикладів та edge cases:

**Unit Test Coverage:**
- Parsing GlobalProtect CLI output (різні формати виводу)
- Portal address validation (valid/invalid formats)
- Icon selection based on state
- Menu item creation and visibility
- Settings persistence (save/load)
- Error message generation
- Command argument construction
- Edge cases: empty output, malformed output, missing fields

**Testing Framework:** Jasmine (стандарт для GNOME Shell extensions)

**Test Structure:**
```javascript
// tests/unit/gpClient.test.js
describe('GlobalProtectClient', () => {
    describe('parseStatus', () => {
        it('should parse connected status correctly', () => {
            const output = 'Status: Connected\nPortal: vpn.epam.com\n';
            const result = GlobalProtectClient.parseStatus(output);
            expect(result.connected).toBe(true);
            expect(result.portal).toBe('vpn.epam.com');
        });
        
        it('should handle disconnected status', () => {
            const output = 'Status: Disconnected\n';
            const result = GlobalProtectClient.parseStatus(output);
            expect(result.connected).toBe(false);
        });
    });
});
```

### Property-Based Testing

Extension буде використовувати property-based testing для перевірки універсальних властивостей, які повинні виконуватися для всіх входів.

**Property Testing Framework:** fast-check (JavaScript property-based testing library)

**Configuration:**
- Мінімум 100 ітерацій для кожного property test
- Використання smart generators для створення realistic test data
- Shrinking для знаходження мінімальних failing cases

**Property Test Structure:**
```javascript
// tests/properties/settings.test.js
import fc from 'fast-check';

describe('Settings Properties', () => {
    it('Property 1: Settings persistence round-trip', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 1: Settings persistence round-trip
         * Validates: Requirements 1.2, 1.3
         */
        fc.assert(
            fc.property(
                fc.domain(), // Generates valid domain names
                (portal) => {
                    const settings = new MockSettings();
                    settings.set_string('portal-address', portal);
                    const loaded = settings.get_string('portal-address');
                    return loaded === portal;
                }
            ),
            { numRuns: 100 }
        );
    });
});
```

**Property Test Examples:**

```javascript
// tests/properties/validation.test.js
describe('Validation Properties', () => {
    it('Property 2: Portal address validation', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 2: Portal address validation
         * Validates: Requirements 1.4
         */
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.domain(),
                    fc.ipV4(),
                    fc.string() // Invalid inputs
                ),
                (input) => {
                    const isValid = validatePortalAddress(input);
                    const isDomain = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(input);
                    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);
                    
                    return isValid === (isDomain || isIP);
                }
            ),
            { numRuns: 100 }
        );
    });
});
```

### Integration Testing

Для тестування взаємодії з реальним GlobalProtect CLI:

1. **Mock GlobalProtect CLI** для CI/CD
2. **Manual testing** на системі з встановленим GlobalProtect
3. **Test scenarios:**
   - Connect to vpn.epam.com with MFA
   - Disconnect from active connection
   - Status polling during connection
   - Advanced commands execution
   - Error scenarios (network down, wrong portal, etc.)

### Test Execution

```bash
# Unit tests
npm test

# Property tests
npm run test:properties

# Integration tests (requires GlobalProtect CLI)
npm run test:integration

# All tests
npm run test:all
```

## Security Considerations

1. **Command Injection Prevention**
   - Всі параметри команд передаються через argv array, не через shell string
   - Валідація всіх user inputs перед використанням

2. **Sensitive Data Handling**
   - Ніколи не логувати паролі, токени, cookies
   - Sanitize error messages перед показом користувачу
   - Не зберігати credentials в settings

3. **Subprocess Security**
   - Використання Gio.Subprocess замість shell execution
   - Proper timeout handling для запобігання zombie processes
   - Перевірка exit codes та stderr

4. **Permission Model**
   - Extension працює з правами користувача
   - GlobalProtect CLI може вимагати sudo для деяких операцій
   - Чітке повідомлення користувачу про необхідні права

## Performance Considerations

1. **Polling Optimization**
   - Configurable poll interval (default 5 seconds)
   - Suspend polling when screen is locked
   - Debounce rapid status changes

2. **Async Operations**
   - Всі subprocess calls асинхронні
   - Non-blocking UI updates
   - Proper cancellation support

3. **Memory Management**
   - Proper cleanup in disable()
   - No memory leaks from signal connections
   - Efficient status object updates (only when changed)

## Deployment

### Package Structure

```
globalprotect@username.github.io/
├── extension.js
├── prefs.js
├── indicator.js
├── gpClient.js
├── statusMonitor.js
├── metadata.json
├── stylesheet.css
├── schemas/
│   └── org.gnome.shell.extensions.globalprotect.gschema.xml
└── locale/
    └── uk/
        └── LC_MESSAGES/
            └── globalprotect.mo
```

### metadata.json

```json
{
  "uuid": "globalprotect@username.github.io",
  "name": "GlobalProtect VPN Indicator",
  "description": "Manage GlobalProtect VPN connections from GNOME Shell panel.\n\nFeatures:\n* Connect/disconnect from VPN\n* Monitor connection status\n* Configure portal address\n* Advanced GlobalProtect operations\n* Native GNOME integration",
  "version": 1,
  "shell-version": ["49"],
  "url": "https://github.com/username/gnome-globalprotect-extension",
  "settings-schema": "org.gnome.shell.extensions.globalprotect"
}
```

### Installation

```bash
# Development installation
ln -s $(pwd) ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io

# Compile schemas
glib-compile-schemas schemas/

# Restart GNOME Shell
# X11: Alt+F2, type 'r', Enter
# Wayland: Log out and log back in

# Enable extension
gnome-extensions enable globalprotect@username.github.io
```

### Distribution

1. **extensions.gnome.org**
   - Submit for review
   - Follow review guidelines
   - Respond to reviewer feedback

2. **GitHub Releases**
   - Tag versions
   - Include installation instructions
   - Provide changelog

## Future Enhancements

1. **Multiple Portal Support**
   - Save multiple portal configurations
   - Quick switch between portals
   - Portal-specific settings

2. **Connection Profiles**
   - Save different connection configurations
   - Auto-connect on network change
   - Location-based profiles

3. **Statistics**
   - Connection duration tracking
   - Data usage monitoring
   - Connection history

4. **Notifications**
   - Configurable notification levels
   - Connection state change alerts
   - Certificate expiration warnings

5. **Localization**
   - Ukrainian translation
   - Other language support
   - RTL language support
