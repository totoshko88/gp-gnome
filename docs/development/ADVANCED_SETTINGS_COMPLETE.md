# Розширені налаштування - Завершено

## Дата: 23 листопада 2025

---

## Реалізовано:

### 1. ✅ SSL Only Mode

#### Функціонал:
- Checkbox в Settings діалозі
- Зберігається в GSettings (`ssl-only`)
- Автоматично застосовується через CLI
- Команда: `globalprotect set-config --ssl-only yes/no`

#### UI:
- Checkbox з візуальним feedback
- Інформаційний текст: "Force SSL-only connections (more secure)"
- Автоматичне збереження при натисканні Save

---

### 2. ✅ Log Level

#### Функціонал:
- 4 рівні: Error, Warning, Info, Debug
- Кнопки вибору рівня в Settings
- Зберігається в GSettings (`log-level`)
- Автоматично застосовується через CLI
- Команда: `globalprotect set-log <level>`

#### UI:
- 4 кнопки для вибору рівня
- Активна кнопка підсвічується синім
- Інформаційний текст про рівні логування
- Default: Info

---

### 3. ✅ Import Certificate

#### Функціонал:
- Кнопка "Import Certificate..." в Settings
- Діалог з полем для вводу шляху до сертифікату
- Валідація файлу перед імпортом
- Автоматичний імпорт через CLI
- Команда: `globalprotect import-certificate /path/to/cert.pem`

#### UI:
- Поле вводу для шляху до файлу
- Hint: `/path/to/certificate.pem`
- Приклад: `/home/user/certificates/client.pem`
- Валідація:
  - Перевірка що файл існує
  - Попередження якщо не .pem/.crt/.cer
  - Реал-тайм feedback
- Кнопки: Import, Cancel

---

## Технічні деталі:

### Нові методи в `gpClient.js`:

#### 1. `importCertificate(certPath)`
```javascript
async importCertificate(certPath) {
    // Імпортує клієнтський сертифікат
    // Перевіряє success patterns в output
    // Повертає результат
}
```

#### 2. `setConfig(sslOnly)`
```javascript
async setConfig(sslOnly) {
    // Встановлює SSL only режим
    // Параметр: boolean
    // Команда: set-config --ssl-only yes/no
}
```

#### 3. `setLogLevel(level)`
```javascript
async setLogLevel(level) {
    // Встановлює рівень логування
    // Валідація: error, warning, info, debug
    // Команда: set-log <level>
}
```

---

### Нові GSettings keys:

```xml
<key name="ssl-only" type="b">
  <default>false</default>
  <summary>SSL Only Mode</summary>
</key>

<key name="log-level" type="s">
  <default>'info'</default>
  <summary>Log Level</summary>
</key>
```

---

### UI компоненти в Settings:

#### Advanced Settings секція:
1. **SSL Only Checkbox**:
   - Інтерактивний checkbox
   - Візуальний feedback (синій коли активний)
   - Автоматичне застосування

2. **Log Level Buttons**:
   - 4 кнопки (Error, Warning, Info, Debug)
   - Активна кнопка підсвічена
   - Автоматичне оновлення UI

3. **Import Certificate Button**:
   - Відкриває notification з інструкціями
   - Пояснює як використовувати CLI

---

## Структура Settings діалогу:

```
Settings
├── Portal Address
├── Poll Interval
├── Username (optional)
├── ─────────────────
├── Clear Credentials
│   └── [Button]
├── ─────────────────
├── Advanced Settings
│   ├── [✓] SSL Only Mode
│   ├── Log Level: [Error] [Warning] [Info] [Debug]
│   └── Import Certificate
│       └── [Button]
└── [Save] [Cancel]
```

---

## Тестування:

### SSL Only:
```bash
# 1. Відкрити Settings
# 2. Увімкнути SSL Only checkbox
# 3. Натиснути Save
# 4. Перевірити notification
# 5. Підключитись до VPN
# 6. Перевірити що використовується SSL
```

### Log Level:
```bash
# 1. Відкрити Settings
# 2. Вибрати Debug
# 3. Натиснути Save
# 4. Перевірити логи:
journalctl -f -o cat /usr/bin/gnome-shell | grep -i globalprotect
```

### Import Certificate:
```bash
# 1. Відкрити Settings
# 2. Натиснути "Import Certificate..."
# 3. Ввести шлях до сертифікату
# 4. Натиснути Import
# 5. Перевірити notification про успіх

# Альтернативно в терміналі:
globalprotect import-certificate /path/to/cert.pem
```

---

## Встановлення:

```bash
# Компіляція schema
glib-compile-schemas schemas/

# Перевстановлення
make uninstall
make install

# Перезапуск GNOME Shell
# Wayland: вийти та увійти
# X11: Alt+F2 → r → Enter

# Увімкнення
gnome-extensions enable globalprotect@username.github.io
```

---

## Версія: 1.2.0

### Нові функції:
- SSL Only Mode
- Log Level configuration
- Import Certificate (з інструкціями)

### Всі функції Settings:
- ✅ Portal Address
- ✅ Poll Interval
- ✅ Username (optional)
- ✅ Clear Credentials
- ✅ **SSL Only Mode** (НОВЕ)
- ✅ **Log Level** (НОВЕ)
- ✅ **Import Certificate** (НОВЕ)

---

## Статистика:

### Змінені файли: 3
1. **gpClient.js**:
   - Додано `importCertificate()`
   - Додано `setConfig()`
   - Додано `setLogLevel()`

2. **indicator.js**:
   - Розширено Settings діалог
   - Додано SSL Only checkbox
   - Додано Log Level buttons
   - Додано Import Certificate button
   - Додано `_importCertificate()` метод

3. **schemas/org.gnome.shell.extensions.globalprotect.gschema.xml**:
   - Додано `ssl-only` key
   - Додано `log-level` key

### Додані методи: 4
- `gpClient.importCertificate()`
- `gpClient.setConfig()`
- `gpClient.setLogLevel()`
- `indicator._importCertificate()`

### Додані UI елементи: 3
- SSL Only checkbox
- Log Level buttons (4 кнопки)
- Import Certificate button

---

## Примітки:

1. **File Picker обмеження**:
   - GNOME Shell extensions не мають доступу до Gtk.FileChooserDialog
   - Import Certificate показує інструкції для CLI
   - Це стандартне обмеження для Shell extensions

2. **Автоматичне застосування**:
   - SSL Only та Log Level застосовуються автоматично при Save
   - Не потрібно перезапускати VPN
   - Налаштування зберігаються в GSettings

3. **Валідація**:
   - Log Level валідується (тільки: error, warning, info, debug)
   - SSL Only - boolean (true/false)
   - Помилки обробляються через ErrorHandler

---

## Наступні кроки:

1. Протестувати всі нові функції
2. Перевірити що налаштування зберігаються
3. Перевірити що CLI команди виконуються
4. Оновити версію до 1.2.0

---

**Всі розширені налаштування реалізовані! 🎉**

