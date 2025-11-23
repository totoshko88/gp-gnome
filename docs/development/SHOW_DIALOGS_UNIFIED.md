# Уніфікація Show діалогів

## Дата: 23 листопада 2025

## ✅ ВИПРАВЛЕНО

### Проблема

Всі пункти Show меню (HIP State, Version, Errors, Notifications, Help) показували інформацію через системні notification, які:
- Зникають автоматично
- Не мають скролінгу
- Обмежені розміром
- Не зручні для довгого тексту

Тільки Host State мав окреме вікно з діалогом.

### Рішення

Створено універсальний метод `_showInfoDialog()` який показує інформацію в модальному діалозі зі скролінгом. Всі Show пункти тепер використовують цей метод.

### Технічні деталі

#### 1. Новий універсальний метод

**Файл**: `indicator.js`, метод `_showInfoDialog()` (рядки 465-520)

```javascript
_showInfoDialog(title, content) {
    // Create modal dialog
    const dialog = new ModalDialog.ModalDialog();
    
    // Add title
    const titleLabel = new St.Label({
        text: title,
        style_class: 'headline',
        x_align: Clutter.ActorAlign.CENTER
    });
    dialog.contentLayout.add_child(titleLabel);
    
    // Add scrollable content area with fixed height
    const scrollView = new St.ScrollView({
        style_class: 'globalprotect-info-scroll',
        style: 'min-width: 600px; max-width: 800px; min-height: 400px; max-height: 600px; border: 1px solid #555;',
        hscrollbar_policy: St.PolicyType.NEVER,
        vscrollbar_policy: St.PolicyType.AUTOMATIC,
        overlay_scrollbars: true
    });
    
    const contentBox = new St.BoxLayout({
        vertical: true,
        style_class: 'globalprotect-info-content',
        style: 'padding: 20px;'
    });
    
    // Add content text
    const contentLabel = new St.Label({
        text: content,
        style_class: 'globalprotect-info-text',
        style: 'font-family: monospace; font-size: 10pt; color: #ffffff;'
    });
    contentLabel.clutter_text.line_wrap = true;
    contentLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
    contentLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
    
    contentBox.add_child(contentLabel);
    scrollView.add_child(contentBox);
    dialog.contentLayout.add_child(scrollView);
    
    // Add close button
    dialog.addButton({
        label: 'Close',
        action: () => dialog.close(),
        key: Clutter.KEY_Escape
    });
    
    // Open dialog
    dialog.open();
}
```

**Функціонал**:
- Приймає title та content
- Створює модальний діалог
- Додає scrollable область (600-800px × 400-600px)
- Monospace шрифт для читабельності
- Word wrap для довгих рядків
- Кнопка Close та підтримка Escape

#### 2. Оновлені методи

**Host State** (рядки 522-533):
```javascript
async _showHostState() {
    try {
        const hostState = await this._gpClient.getHostState();
        this._showInfoDialog('GlobalProtect Host State', hostState);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get host state', {notify: true, log: true});
    }
}
```

**HIP State** (рядки 828-837):
```javascript
async _showHIPState() {
    try {
        const hipState = await this._gpClient.getHostState();
        this._showInfoDialog('GlobalProtect HIP State', hipState);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get HIP state', {notify: true, log: true});
    }
}
```

**Errors** (рядки 841-850):
```javascript
async _showErrors() {
    try {
        const errors = await this._gpClient.getErrors();
        this._showInfoDialog('GlobalProtect Errors', errors);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get errors', {notify: true, log: true});
    }
}
```

**Notifications** (рядки 854-863):
```javascript
async _showNotifications() {
    try {
        const notifications = await this._gpClient.getNotifications();
        this._showInfoDialog('GlobalProtect Notifications', notifications);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get notifications', {notify: true, log: true});
    }
}
```

**Help** (рядки 791-799):
```javascript
async _showHelp() {
    try {
        const help = await this._gpClient.getHelp();
        this._showInfoDialog('GlobalProtect Help', help);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get help', {notify: true, log: true});
    }
}
```

**Version (About)** (рядки 867-879):
```javascript
async _showAbout() {
    try {
        const version = await this._gpClient.getVersion();
        const content = `${version}\n\n` +
            `GNOME Shell Extension\n` +
            `Extension version: 1.0\n\n` +
            `© 2025 GlobalProtect Extension`;
        this._showInfoDialog('About GlobalProtect', content);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to get version', {notify: true, log: true});
    }
}
```

### Переваги

1. **Єдиний стиль** - всі Show пункти виглядають однаково
2. **Скролінг** - весь текст доступний незалежно від розміру
3. **Читабельність** - monospace шрифт, білий текст на темному фоні
4. **Зручність** - діалог не зникає автоматично
5. **Керування** - кнопка Close та Escape для закриття
6. **Підтримка** - легко додавати нові Show пункти

### Структура діалогу

```
ModalDialog
├── Title Label (динамічний заголовок)
├── ScrollView (600-800px × 400-600px)
│   └── ContentBox (padding: 20px)
│       └── Content Label (monospace, white, word-wrap)
└── Close Button (Escape підтримка)
```

### Змінені методи

| Метод | Було | Стало |
|-------|------|-------|
| `_showHostState()` | Власний діалог | `_showInfoDialog()` |
| `_showHIPState()` | `_showNotification()` | `_showInfoDialog()` |
| `_showErrors()` | `_showNotification()` | `_showInfoDialog()` |
| `_showNotifications()` | `_showNotification()` | `_showInfoDialog()` |
| `_showHelp()` | `_showNotification()` | `_showInfoDialog()` |
| `_showAbout()` | `_showNotification()` | `_showInfoDialog()` |

### Тестування

**Для кожного Show пункту**:

1. **Host State**:
   - Show → Host State
   - Перевірити діалог з HIP інформацією
   - Перевірити скролінг

2. **HIP State**:
   - Show → HIP State
   - Перевірити діалог з HIP інформацією
   - Перевірити скролінг

3. **Errors**:
   - Show → Errors
   - Перевірити діалог з помилками
   - Перевірити що показує "No errors" якщо немає помилок

4. **Notifications**:
   - Show → Notifications
   - Перевірити діалог з повідомленнями
   - Перевірити скролінг

5. **Help**:
   - Show → Help
   - Перевірити діалог з довідкою
   - Перевірити скролінг

6. **Version**:
   - Show → Version
   - Перевірити діалог з версією
   - Перевірити інформацію про extension

**Загальні перевірки**:
- Діалог відкривається по центру екрану
- Scrollbar з'являється коли потрібно
- Close кнопка працює
- Escape закриває діалог
- Текст читабельний (білий на темному)
- Monospace шрифт для технічної інформації

## 📊 ПІДСУМОК

**Створено**: 1 універсальний метод `_showInfoDialog()`  
**Оновлено**: 6 методів Show меню  
**Видалено**: Використання `_showNotification()` для Show пунктів  
**Переваги**: Єдиний стиль, скролінг, зручність  
**Файли змінено**: `indicator.js`

## 🔄 Наступні кроки

1. **Перезапустити GNOME Shell** (вийти/увійти)
2. **Протестувати всі Show пункти**:
   - Host State
   - HIP State
   - Errors
   - Notifications
   - Help
   - Version
3. **Перевірити**:
   - Діалоги відкриваються
   - Скролінг працює
   - Close та Escape працюють
   - Текст читабельний

## ✨ Статус

**Версія**: 1.0.6  
**Готовність**: Ready for Testing 🧪  
**Пріоритет**: High - покращує UX для всіх Show пунктів
