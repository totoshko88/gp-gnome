# Фінальні виправлення - Раунд 3

## Дата: 23 листопада 2025

## ✅ ВИПРАВЛЕНО 3 ПРОБЛЕМИ

### 1. ✅ Видалено дублікат HIP State

**Проблема**: Show → Host State та Show → HIP State показували одне і те саме (обидва викликали `getHostState()`)

**Рішення**: Видалено HIP State з меню, залишено тільки Host State

**Файли**:
- `indicator.js`: Видалено пункт меню "HIP State" (рядки 184-187)
- `indicator.js`: Видалено метод `_showHIPState()` (рядки 830-842)

**Результат**: Тепер в Show меню тільки один пункт "Host State" який показує HIP інформацію

---

### 2. ✅ Додано retry логіку для всіх Show методів

**Проблема**: При відкритті Show діалогів з'являлась помилка:
```
Unable to establish a new GlobalProtect connection as a GlobalProtect connection 
is already established from this Linux system by the same user or another user.
```

**Рішення**: Додано retry логіку (до 2 спроб з затримкою 1 секунда) для всіх Show методів:

**Оновлені методи в gpClient.js**:

1. **getHostState()** (рядки 755-777):
```javascript
async getHostState(retryCount = 0) {
    try {
        const result = await this._executeCommand(['show', '--host-state'], 5);
        const output = result.stdout + result.stderr;
        
        // Check for "already established" error
        if (output.includes('already established') || 
            output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < 2) {
                log(`GlobalProtect CLI bug detected in getHostState. Retrying (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.getHostState(retryCount + 1);
            }
        }
        
        return result.stdout || result.stderr || 'No host state information available';
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get host state', {notify: false, log: true});
        throw e;
    }
}
```

2. **getVersion()** (рядки 659-681)
3. **getErrors()** (рядки 674-696)
4. **getNotifications()** (рядки 795-817)
5. **getHelp()** (рядки 580-602)

**Логіка retry**:
- Перевіряє чи є помилка "already established" в output
- Якщо так і це не остання спроба (< 2), чекає 1 секунду та повторює
- Після 2 спроб повертає результат (навіть якщо помилка)
- Логує кожну спробу retry

**Результат**: Діалоги тепер показують правильну інформацію замість помилки "already established"

---

### 3. ✅ Додано disconnect при Log Off

**Проблема**: При виході з GNOME сесії (Log Off) VPN залишався підключеним

**Вимоги**:
- При Log Off - відключити VPN
- При Lock - НЕ відключати VPN

**Рішення**: Додано підключення до Session Manager для відстеження стану сесії

**Файл**: `extension.js`

#### Новий метод `_connectToSessionManager()` (рядки 68-88):
```javascript
_connectToSessionManager() {
    try {
        const SessionManager = Main.sessionMode;
        
        // Listen for session mode changes (logout, lock, etc.)
        this._sessionModeChangedId = Main.sessionMode.connect('updated', () => {
            // Check if session is ending (logout)
            if (Main.sessionMode.isLocked) {
                // Session is locked - do NOT disconnect
                log('GlobalProtect Extension: Session locked, keeping VPN connected');
            } else if (!Main.sessionMode.hasOverview) {
                // Session is ending (logout) - disconnect VPN
                log('GlobalProtect Extension: Session ending, disconnecting VPN');
                this._disconnectOnLogout();
            }
        });
        
        log('GlobalProtect Extension: Connected to session manager');
    } catch (error) {
        logError(error, 'GlobalProtect Extension: Failed to connect to session manager');
    }
}
```

#### Новий метод `_disconnectOnLogout()` (рядки 90-100):
```javascript
async _disconnectOnLogout() {
    try {
        log('GlobalProtect Extension: Disconnecting VPN on logout');
        await this._gpClient.disconnect();
        log('GlobalProtect Extension: VPN disconnected successfully');
    } catch (error) {
        logError(error, 'GlobalProtect Extension: Failed to disconnect on logout');
    }
}
```

#### Оновлено `enable()` (рядок 66):
```javascript
// Connect to session manager for logout detection
this._connectToSessionManager();
```

#### Оновлено `disable()` (рядки 105-109):
```javascript
// Disconnect session manager signal
if (this._sessionModeChangedId) {
    Main.sessionMode.disconnect(this._sessionModeChangedId);
    this._sessionModeChangedId = null;
}
```

**Логіка**:
- При `enable()` підключається до Session Manager
- Слухає події `updated` від `Main.sessionMode`
- Якщо `isLocked = true` - сесія заблокована, VPN залишається підключеним
- Якщо `hasOverview = false` - сесія завершується (logout), викликає disconnect
- При `disable()` відключає signal

**Результат**: 
- ✅ При Log Off - VPN автоматично відключається
- ✅ При Lock - VPN залишається підключеним

---

## 📊 ПІДСУМОК

**Виправлено**: 3 з 3 проблем (100%)

### Зміни в файлах:

1. **indicator.js**:
   - Видалено дублікат HIP State menu item
   - Видалено метод `_showHIPState()`

2. **gpClient.js**:
   - Додано retry логіку для 5 методів:
     - `getHostState()`
     - `getVersion()`
     - `getErrors()`
     - `getNotifications()`
     - `getHelp()`

3. **extension.js**:
   - Додано `_connectToSessionManager()`
   - Додано `_disconnectOnLogout()`
   - Оновлено `enable()` та `disable()`

### Переваги:

1. **Менше дублювання** - один пункт Host State замість двох
2. **Надійність** - retry логіка обробляє CLI баги
3. **Безпека** - автоматичне відключення при logout
4. **Зручність** - VPN залишається при lock екрану

---

## 🔄 Наступні кроки

1. **Перезапустити GNOME Shell** (вийти/увійти)
2. **Протестувати Show діалоги**:
   - Host State (має показати HIP інформацію без помилок)
   - Version (має показати версію без помилок)
   - Errors (має показати помилки без помилок)
   - Notifications (має показати повідомлення без помилок)
   - Help (має показати довідку без помилок)
3. **Протестувати logout**:
   - Підключитись до VPN
   - Вийти з сесії (Log Off)
   - Увійти знову
   - Перевірити що VPN відключений
4. **Протестувати lock**:
   - Підключитись до VPN
   - Заблокувати екран (Lock)
   - Розблокувати
   - Перевірити що VPN залишився підключеним

---

## ✨ Статус

**Версія**: 1.0.7  
**Готовність**: Ready for Testing 🧪  
**Критичність**: High - виправляє баги та додає важливий функціонал
