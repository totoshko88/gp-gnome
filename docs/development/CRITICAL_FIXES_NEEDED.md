# Критичні виправлення для GlobalProtect Extension

## 🔴 Критичні проблеми

### 1. Settings викликає крах GNOME Shell
**Проблема:** `GLib-GIO:ERROR: assertion failed: (self->pid == pid)`
**Причина:** Неправильне створення subprocess для `gnome-extensions prefs`
**Рішення:** 
- Видалити subprocess виклик
- Використати простий notification з інструкціями
- Settings можна відкрити тільки через термінал або GUI

### 2. Gateway menu порожнє
**Проблема:** Список шлюзів не завантажується
**Причина:** Метод `getGateways()` неправильно парсить вивід `show --details`
**Рішення:**
- Виправити парсинг виводу GlobalProtect
- Додати fallback якщо шлюзи не знайдені
- Показувати поточний шлюз

### 3. Change Portal неузгоджений
**Проблема:** Кнопка "Change Portal" каже відкрити Settings, але Settings не працює
**Рішення:**
- Додати можливість вводу порталу через діалог (якщо можливо)
- Або показати чіткі інструкції як змінити через gsettings
- Зробити узгоджений UX

## 📋 Список виправлень

### Виправлення 1: Видалити небезпечний subprocess для Settings
```javascript
// ВИДАЛИТИ:
async _openSettings() {
    const proc = Gio.Subprocess.new(...);  // ❌ Викликає крах
}

// ЗАМІНИТИ НА:
_openSettings() {
    this._showNotification(
        'Settings',
        'To change settings, use one of:\n\n' +
        '1. Terminal:\n   gsettings set org.gnome.shell.extensions.globalprotect portal-address "vpn.example.com"\n\n' +
        '2. GUI:\n   gnome-extensions prefs globalprotect@username.github.io'
    );
}
```

### Виправлення 2: Виправити getGateways()
```javascript
async getGateways() {
    // Парсити вивід show --details правильно
    // Шукати рядки з Gateway:
    // Повертати масив {name, ip}
}
```

### Виправлення 3: Покращити Change Portal
```javascript
_changePortal() {
    const currentPortal = this._settings.get_string('portal-address');
    this._showNotification(
        'Change Portal',
        `Current portal: ${currentPortal}\n\n` +
        'To change portal:\n' +
        '1. Terminal:\n   gsettings set org.gnome.shell.extensions.globalprotect portal-address "new.portal.com"\n\n' +
        '2. Or disconnect and use Settings'
    );
}
```

### Виправлення 4: Додати безпечну перевірку subprocess
- Ніколи не використовувати Gio.Subprocess.new() в меню callbacks
- Використовувати тільки для GlobalProtect CLI команд
- Для GUI операцій використовувати notifications

## 🎯 План дій

1. ✅ Видалити subprocess з _openSettings()
2. ✅ Виправити getGateways() парсинг
3. ✅ Покращити Change Portal UX
4. ✅ Додати безпечні fallbacks
5. ✅ Протестувати без крашів

## ⚠️ Важливо

- НЕ використовувати Gio.Subprocess для GUI операцій
- Використовувати subprocess ТІЛЬКИ для GlobalProtect CLI
- Завжди додавати try-catch
- Завжди тестувати на крашах
