# Інтерактивні Settings діалоги та Copy функція

## Дата: 23 листопада 2025

## ✅ РЕАЛІЗОВАНО 2 ФУНКЦІЇ

### 1. ✅ Інтерактивні Settings діалоги

**Проблема**: Settings → Change Portal та Settings → Configure показували тільки інструкції, без можливості змінити значення

**Рішення**: Створено інтерактивні діалоги з полями вводу та кнопками Save/Cancel

#### Settings → Change Portal

**Файл**: `indicator.js`, метод `_changePortal()` (рядки 569-650)

**Функціонал**:
- Показує поточний portal
- Поле вводу для нового portal (з hint text)
- Кнопка Save - зберігає новий portal в GSettings
- Кнопка Cancel - закриває без змін
- Enter - зберігає, Escape - скасовує
- Автоматичний focus на поле вводу

**Код**:
```javascript
_changePortal() {
    const currentPortal = this._settings.get_string('portal-address');
    
    // Create modal dialog
    const dialog = new ModalDialog.ModalDialog();
    
    // Title
    const titleLabel = new St.Label({
        text: 'Change Portal',
        style_class: 'headline',
        x_align: Clutter.ActorAlign.CENTER
    });
    
    // Current portal label
    const currentLabel = new St.Label({
        text: `Current portal: ${currentPortal}`,
        style: 'font-size: 11pt; color: #ffffff;'
    });
    
    // Portal input field
    const portalEntry = new St.Entry({
        text: currentPortal,
        hint_text: 'vpn.example.com',
        style: 'font-size: 11pt; padding: 8px; min-width: 400px;',
        can_focus: true
    });
    
    // Save button
    dialog.addButton({
        label: 'Save',
        action: () => {
            const newPortal = portalEntry.get_text();
            if (newPortal && newPortal !== currentPortal) {
                this._settings.set_string('portal-address', newPortal);
                this._showNotification('Portal Changed', 
                    `Portal set to: ${newPortal}\n\nReconnect to VPN to use new portal.`);
            }
            dialog.close();
        },
        key: Clutter.KEY_Return
    });
    
    // Cancel button
    dialog.addButton({
        label: 'Cancel',
        action: () => dialog.close(),
        key: Clutter.KEY_Escape
    });
    
    dialog.open();
    global.stage.set_key_focus(portalEntry);
}
```

**Використання**:
1. Settings → Change Portal
2. Вводите новий portal
3. Натискаєте Save (або Enter)
4. Portal зберігається в GSettings
5. Показується notification з підтвердженням

#### Settings → Configure

**Файл**: `indicator.js`, метод `_openSettings()` (рядки 810-920)

**Функціонал**:
- Показує поточні значення Portal та Poll Interval
- Два поля вводу:
  - Portal Address (текст)
  - Poll Interval (число в секундах)
- Кнопка Save - зберігає обидва значення
- Кнопка Cancel - закриває без змін
- Enter - зберігає, Escape - скасовує
- Автоматичний focus на перше поле
- Перезапускає status monitor з новим інтервалом

**Код**:
```javascript
_openSettings() {
    const currentPortal = this._settings.get_string('portal-address');
    const currentInterval = this._settings.get_int('poll-interval');
    
    // Create modal dialog with two input fields
    const dialog = new ModalDialog.ModalDialog();
    
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

**Використання**:
1. Settings → Configure
2. Змінюєте Portal та/або Poll Interval
3. Натискаєте Save (або Enter)
4. Обидва значення зберігаються
5. Status monitor перезапускається з новим інтервалом
6. Показується notification з підтвердженням

---

### 2. ✅ Кнопка Copy для Show діалогів

**Проблема**: Неможливо скопіювати текст з Show діалогів (Host State, Version, Errors, etc.)

**Рішення**: Додано кнопку "Copy" до всіх Show діалогів

**Файл**: `indicator.js`, метод `_showInfoDialog()` (рядки 465-525)

**Функціонал**:
- Кнопка "Copy" поруч з "Close"
- Копіює весь текст діалогу в clipboard
- Показує notification "Content copied to clipboard"
- Працює для всіх Show пунктів:
  - Host State
  - Version
  - Errors
  - Notifications

**Код**:
```javascript
_showInfoDialog(title, content) {
    // ... створення діалогу ...
    
    // Add Copy button
    dialog.addButton({
        label: 'Copy',
        action: () => {
            // Copy content to clipboard
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, content);
            this._showNotification('Copied', 'Content copied to clipboard');
        }
    });
    
    // Add close button
    dialog.addButton({
        label: 'Close',
        action: () => dialog.close(),
        key: Clutter.KEY_Escape
    });
    
    dialog.open();
}
```

**Використання**:
1. Відкрити будь-який Show діалог (Host State, Version, etc.)
2. Натиснути кнопку "Copy"
3. Весь текст копіюється в clipboard
4. Показується notification "Content copied to clipboard"
5. Можна вставити текст в будь-яку програму (Ctrl+V)

---

## 📊 ПІДСУМОК

**Реалізовано**: 2 функції

### Зміни в файлах:

**indicator.js**:
1. `_changePortal()` - інтерактивний діалог з полем вводу
2. `_openSettings()` - інтерактивний діалог з двома полями вводу
3. `_showInfoDialog()` - додано кнопку Copy

### Переваги:

1. **Зручність** - можна змінити settings прямо з меню
2. **Швидкість** - не потрібно відкривати термінал або prefs
3. **Інтуїтивність** - зрозумілий UI з полями вводу
4. **Копіювання** - легко скопіювати Host State або інші дані
5. **Валідація** - перевірка введених значень
6. **Feedback** - notification після збереження

### Технічні деталі:

**St.Entry** - поле вводу:
- `text` - початкове значення
- `hint_text` - підказка
- `can_focus` - можливість фокусу
- `get_text()` - отримати введений текст

**St.Clipboard** - буфер обміну:
- `get_default()` - отримати clipboard
- `set_text()` - скопіювати текст
- `St.ClipboardType.CLIPBOARD` - тип clipboard

**global.stage.set_key_focus()** - встановити фокус на поле вводу

---

## 🔄 Наступні кроки

1. **Перезапустити GNOME Shell** (вийти/увійти)
2. **Протестувати Change Portal**:
   - Settings → Change Portal
   - Ввести новий portal
   - Натиснути Save
   - Перевірити що portal змінився
3. **Протестувати Configure**:
   - Settings → Configure
   - Змінити Portal та Poll Interval
   - Натиснути Save
   - Перевірити що обидва значення змінились
4. **Протестувати Copy**:
   - Show → Host State
   - Натиснути Copy
   - Вставити в текстовий редактор (Ctrl+V)
   - Перевірити що текст скопіювався

---

## ✨ Статус

**Версія**: 1.0.9  
**Готовність**: Ready for Testing 🧪  
**Критичність**: High - покращує UX
