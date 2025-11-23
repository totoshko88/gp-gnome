# TODO: Фінальні виправлення

## Поточний стан

Extension працює, але потребує фінальних покращень для оптимізації UX.

## Критичні виправлення

### 1. ❌ Gateway перемикається на перший замість обраного

**Файл:** `indicator.js`, метод `_setGateway()`

**Проблема:**
```javascript
// Після setPreferredGateway викликається:
await this._gpClient.connect(portal);  // ❌ Підключається до порталу (перший gateway)
```

**Рішення:**
```javascript
// Замінити на:
await this._gpClient.connectToGateway(gateway);  // ✅ Підключається до обраного gateway
```

**Код для заміни:**
```javascript
async _setGateway(gateway) {
    try {
        const currentStatus = this._statusMonitor.getCurrentStatus();
        
        this._showNotification('Switching Gateway', `Switching to ${gateway}...`);
        
        // Disconnect if connected
        if (currentStatus && currentStatus.connected) {
            await this._gpClient.disconnect();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Set preferred gateway
        await this._gpClient.setPreferredGateway(gateway);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Connect to the selected gateway (NOT portal!)
        await this._gpClient.connectToGateway(gateway);  // ✅ FIX
        
        this._showNotification('Gateway Changed', `Successfully switched to: ${gateway}`);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to switch gateway', {notify: true, log: true});
    }
}
```

### 2. ✅ Кешування gateway списку

**Файл:** `indicator.js`

**Додати змінну для кешу:**
```javascript
class GlobalProtectIndicator {
    _init(...) {
        // ... existing code ...
        this._gatewayListCache = null;  // ADD THIS
        this._lastGatewayUpdate = 0;
    }
}
```

**Оновити `_updateGatewayMenu()`:**
```javascript
async _updateGatewayMenu() {
    try {
        this._gatewayMenu.menu.removeAll();
        
        // Use cache if available and fresh (< 5 minutes)
        const now = Date.now();
        if (this._gatewayListCache && (now - this._lastGatewayUpdate) < 300000) {
            this._buildGatewayMenuItems(this._gatewayListCache);
            return;
        }
        
        // Get fresh gateway list
        const gateways = await this._gpClient.getGateways();
        this._gatewayListCache = gateways;
        this._lastGatewayUpdate = now;
        
        this._buildGatewayMenuItems(gateways);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to update gateway menu', {notify: false, log: true});
    }
}

_buildGatewayMenuItems(gateways) {
    if (gateways.length === 0) {
        const noGatewaysItem = new PopupMenu.PopupMenuItem('No gateways available', {
            reactive: false
        });
        this._gatewayMenu.menu.addMenuItem(noGatewaysItem);
        return;
    }
    
    // Sort and add gateway items
    gateways.sort((a, b) => {
        if (a.current && !b.current) return -1;
        if (!a.current && b.current) return 1;
        if (a.preferred && !b.preferred) return -1;
        if (!a.preferred && b.preferred) return 1;
        return a.name.localeCompare(b.name);
    });
    
    for (const gateway of gateways) {
        let label = gateway.name;
        if (gateway.current) {
            label = `✓ ${label} (current)`;
        } else if (gateway.preferred) {
            label = `★ ${label} (preferred)`;
        }
        
        const gatewayItem = new PopupMenu.PopupMenuItem(label, {
            reactive: !gateway.current
        });
        
        if (!gateway.current) {
            gatewayItem.connect('activate', () => this._setGateway(gateway.name));
        }
        
        this._gatewayMenu.menu.addMenuItem(gatewayItem);
    }
    
    this._gatewayMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    
    const countItem = new PopupMenu.PopupMenuItem(`${gateways.length} gateway(s) available`, {
        reactive: false,
        style_class: 'globalprotect-gateway-info'
    });
    this._gatewayMenu.menu.addMenuItem(countItem);
}
```

### 3. ✅ Показувати Gateway info в статусі

**Файл:** `indicator.js`, метод `_updateMenu()`

**Змінити відображення статусу:**
```javascript
_updateMenu(status) {
    if (status?.connected) {
        let statusText = `Connected to ${status.portal}`;
        
        // Add gateway info if available
        if (status.gateway) {
            statusText += `\nGateway: ${status.gateway}`;
        }
        if (status.clientIp) {
            statusText += `\nIP: ${status.clientIp}`;
        }
        
        this._statusLabel.text = statusText;
        this._toggleItem.label.text = 'Disconnect';
    } else {
        this._statusLabel.text = 'Not connected';
        this._toggleItem.label.text = 'Connect';
    }
}
```

### 4. ❌ Прибрати Show → Connection Details

**Файл:** `indicator.js`, метод `_buildMenu()`

**Видалити:**
```javascript
// REMOVE THIS:
const detailsItem = new PopupMenu.PopupMenuItem('Connection Details');
detailsItem.connect('activate', () => this._showConnectionDetails());
showMenu.menu.addMenuItem(detailsItem);
```

### 5. ✅ Виправити Collect Logs (відкриття теки)

**Файл:** `indicator.js`, метод `_collectLogsAndOpen()`

**Перевірити код:**
```javascript
async _collectLogsAndOpen() {
    try {
        const result = await this._gpClient.collectLog();
        
        // Extract log file path
        const logPath = this._gpClient.extractLogFilePath(result);
        
        if (logPath) {
            // Open folder containing the log file
            const logFile = Gio.File.new_for_path(logPath);
            const logDir = logFile.get_parent();
            
            if (logDir && logDir.query_exists(null)) {
                // Open file manager with the folder
                const launcher = Gio.AppInfo.get_default_for_type('inode/directory', false);
                if (launcher) {
                    launcher.launch([logDir], null);
                    this._showNotification('Log Collection', 
                        `Logs collected successfully.\nFile: ${logPath}\n\nFolder opened in file manager.`);
                } else {
                    this._showNotification('Log Collection', 
                        `Logs collected successfully.\nFile: ${logPath}\n\nCould not open file manager.`);
                }
            } else {
                this._showNotification('Log Collection', 
                    `Logs collected successfully.\nFile: ${logPath}`);
            }
        } else {
            this._showNotification('Log Collection', result);
        }
    } catch (e) {
        ErrorHandler.handle(e, 'Log Collection failed', {notify: true, log: true});
    }
}
```

### 6. ✅ Вирівняти Advanced меню

**Файл:** `stylesheet.css`

**Додати стилі:**
```css
.globalprotect-advanced-menu {
    padding-left: 0px;
}

.globalprotect-show-menu {
    padding-left: 0px;
}

.globalprotect-settings-menu {
    padding-left: 0px;
}

.globalprotect-gateway-menu {
    padding-left: 0px;
}
```

### 7. ✅ Додати Show → Host State

**Файл:** `indicator.js`, метод `_buildMenu()`

**Вже реалізовано!** Перевірте що є:
```javascript
// Show HIP State
const hipStateItem = new PopupMenu.PopupMenuItem('HIP State');
hipStateItem.connect('activate', () => this._showHIPState());
showMenu.menu.addMenuItem(hipStateItem);
```

Якщо немає, додати після інших Show опцій.

## Порядок виправлень

1. **Критично:** Виправити `_setGateway()` - використати `connectToGateway()`
2. Додати кешування gateway списку
3. Покращити відображення статусу
4. Прибрати Connection Details з меню
5. Перевірити Collect Logs
6. Вирівняти меню через CSS
7. Перевірити що Host State є в меню

## Тестування після виправлень

1. **Gateway перемикання:**
   - Підключитись до VPN
   - Вибрати інший gateway (наприклад vpn-ua.epam.com)
   - Перевірити що підключилось саме до нього (не до vpn-eu)

2. **Кешування:**
   - Відкрити Select Gateway
   - Закрити
   - Відкрити знову
   - Повинно відкритись миттєво (без запиту)

3. **Статус:**
   - Підключитись
   - Перевірити що статус показує Gateway Name та IP

4. **Collect Logs:**
   - Клікнути Advanced → Collect Logs
   - Повинна відкритись тека ~/.GlobalProtect/

## Після виправлень

Extension буде повністю функціональний та оптимізований!
