# Спрощення Settings меню

## Дата: 23 листопада 2025

## ✅ ВИКОНАНО

### Проблема

Settings було submenu з 3 пунктами:
- Change Portal...
- Configure...
- Clear Credentials

Це створювало зайвий рівень вкладеності та ускладнювало навігацію.

### Рішення

Замінено Settings submenu на один пункт "Settings" який відкриває комплексний діалог з усіма налаштуваннями.

---

## Зміни

### 1. Структура меню

**Було**:
```
Settings ▶
  ├─ Change Portal...
  ├─ Configure...
  └─ Clear Credentials
```

**Стало**:
```
Settings (відкриває діалог)
```

**Файл**: `indicator.js` (рядки 205-210)

**Код**:
```javascript
// Settings - single menu item that opens comprehensive settings dialog
const settingsItem = new PopupMenu.PopupMenuItem('Settings');
settingsItem.connect('activate', () => this._openSettingsDialog());
this.menu.addMenuItem(settingsItem);
```

---

### 2. Новий метод _openSettingsDialog()

**Файл**: `indicator.js`, метод `_openSettingsDialog()` (рядки 810-950)

**Функціонал діалогу**:

#### Секція 1: Portal Address
- Label: "Portal Address:"
- Entry field з поточним значенням
- Hint: "vpn.example.com"

#### Секція 2: Poll Interval
- Label: "Poll Interval (seconds):"
- Entry field з поточним значенням
- Hint: "5"
- Info: "Poll interval: how often to check VPN status (recommended: 5-10 seconds)"

#### Секція 3: Clear Credentials
- Separator (візуальне розділення)
- Label: "Clear Credentials:"
- Button: "Clear Saved Credentials" (червона кнопка)
- Info: "Remove saved username and password from GlobalProtect"
- При натисканні закриває діалог і викликає `_clearCredentials()`

#### Кнопки діалогу
- **Save** - зберігає Portal та Poll Interval, Enter для швидкого збереження
- **Cancel** - закриває без змін, Escape для швидкого закриття

**Код**:
```javascript
_openSettingsDialog() {
    const currentPortal = this._settings.get_string('portal-address');
    const currentInterval = this._settings.get_int('poll-interval');
    
    const dialog = new ModalDialog.ModalDialog();
    
    // Title
    const titleLabel = new St.Label({
        text: 'Settings',
        style_class: 'headline',
        x_align: Clutter.ActorAlign.CENTER
    });
    
    // Portal section
    const portalLabel = new St.Label({
        text: 'Portal Address:',
        style: 'font-size: 11pt; color: #ffffff;'
    });
    
    const portalEntry = new St.Entry({
        text: currentPortal,
        hint_text: 'vpn.example.com',
        style: 'font-size: 11pt; padding: 8px; min-width: 400px;',
        can_focus: true
    });
    
    // Poll interval section
    const intervalLabel = new St.Label({
        text: 'Poll Interval (seconds):',
        style: 'font-size: 11pt; color: #ffffff; margin-top: 15px;'
    });
    
    const intervalEntry = new St.Entry({
        text: currentInterval.toString(),
        hint_text: '5',
        style: 'font-size: 11pt; padding: 8px; min-width: 100px;',
        can_focus: true
    });
    
    // Separator
    const separator = new St.Widget({
        style: 'height: 1px; background-color: #555; margin-top: 20px; margin-bottom: 20px;'
    });
    
    // Clear Credentials section
    const clearCredsLabel = new St.Label({
        text: 'Clear Credentials:',
        style: 'font-size: 11pt; color: #ffffff;'
    });
    
    const clearCredsButton = new St.Button({
        label: 'Clear Saved Credentials',
        style: 'font-size: 11pt; padding: 8px 16px; background-color: #c01c28; color: #ffffff; border-radius: 6px;',
        can_focus: true
    });
    clearCredsButton.connect('clicked', () => {
        dialog.close();
        this._clearCredentials();
    });
    
    // Save button
    dialog.addButton({
        label: 'Save',
        action: () => {
            const newPortal = portalEntry.get_text();
            const newInterval = parseInt(intervalEntry.get_text());
            
            let changed = false;
            let message = 'Settings saved:\n';
            
            if (newPortal && newPortal !== currentPortal) {
                this._settings.set_string('portal-address', newPortal);
                message += `\nPortal: ${newPortal}`;
                changed = true;
            }
            
            if (!isNaN(newInterval) && newInterval > 0 && newInterval !== currentInterval) {
                this._settings.set_int('poll-interval', newInterval);
                message += `\nPoll interval: ${newInterval}s`;
                changed = true;
                
                // Restart status monitor with new interval
                if (this._statusMonitor) {
                    this._statusMonitor.stop();
                    this._statusMonitor._pollInterval = newInterval * 1000;
                    this._statusMonitor.start();
                }
            }
            
            if (changed) {
                this._showNotification('Settings', message);
            }
            
            dialog.close();
        },
        key: Clutter.KEY_Return
    });
    
    dialog.open();
    global.stage.set_key_focus(portalEntry);
}
```

---

## Переваги

### 1. Простіша навігація
- Один клік замість двох
- Немає вкладених меню
- Всі налаштування в одному місці

### 2. Кращий UX
- Всі опції видимі одразу
- Зрозуміла структура
- Логічне групування

### 3. Візуальне розділення
- Separator між секціями
- Червона кнопка для Clear Credentials (небезпечна операція)
- Інформаційні підказки

### 4. Швидкість
- Enter - зберегти
- Escape - скасувати
- Автоматичний focus на перше поле

---

## Структура діалогу

```
┌─────────────────────────────────────┐
│           Settings                  │
├─────────────────────────────────────┤
│                                     │
│ Portal Address:                     │
│ [vpn.example.com              ]     │
│                                     │
│ Poll Interval (seconds):            │
│ [5   ]                              │
│ Poll interval: how often to check...│
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Clear Credentials:                  │
│ [ Clear Saved Credentials ]         │
│ Remove saved username and password  │
│                                     │
├─────────────────────────────────────┤
│           [Save]  [Cancel]          │
└─────────────────────────────────────┘
```

---

## Використання

### Відкрити Settings:
1. Клік на іконку extension в панелі
2. Клік на "Settings"
3. Діалог відкривається з усіма опціями

### Змінити Portal:
1. Відкрити Settings
2. Ввести новий portal в поле "Portal Address"
3. Натиснути Save (або Enter)

### Змінити Poll Interval:
1. Відкрити Settings
2. Ввести нове значення в поле "Poll Interval"
3. Натиснути Save (або Enter)
4. Status monitor автоматично перезапуститься

### Очистити Credentials:
1. Відкрити Settings
2. Натиснути червону кнопку "Clear Saved Credentials"
3. Діалог закриється
4. З'явиться confirmation діалог для Clear Credentials

---

## Старі методи

Методи `_changePortal()` та старий `_openSettings()` залишені в коді але більше не викликаються. Можуть бути видалені в майбутньому якщо не знадобляться.

---

## 📊 ПІДСУМОК

**Змінено**: Settings submenu → Settings menu item  
**Створено**: Новий метод `_openSettingsDialog()`  
**Переваги**: Простіша навігація, кращий UX, всі опції в одному місці

---

## 🔄 Наступні кроки

1. **Перезапустити GNOME Shell** (вийти/увійти)
2. **Протестувати Settings**:
   - Відкрити меню extension
   - Клік на "Settings"
   - Перевірити що діалог відкривається
   - Перевірити всі 3 секції
3. **Протестувати зміну Portal**:
   - Ввести новий portal
   - Натиснути Save
   - Перевірити що portal змінився
4. **Протестувати зміну Poll Interval**:
   - Ввести нове значення
   - Натиснути Save
   - Перевірити що інтервал змінився
5. **Протестувати Clear Credentials**:
   - Натиснути червону кнопку
   - Перевірити що з'явився confirmation

---

## ✨ Статус

**Версія**: 1.0.11  
**Готовність**: Ready for Testing 🧪  
**Критичність**: Medium - покращує UX
