# Виправлення GlobalProtect Extension

## Виправлені проблеми

### 1. ✅ Settings не відкривались
**Проблема:** Unhandled promise rejection при спробі відкрити Settings через `Main.extensionManager.openExtensionPrefs()`

**Рішення:** Замінено на виклик через `Gio.Subprocess`:
```javascript
const proc = Gio.Subprocess.new(
    ['gnome-extensions', 'prefs', 'globalprotect@username.github.io'],
    Gio.SubprocessFlags.NONE
);
```

### 2. ✅ Advanced команди падали
**Проблема:** HIP resubmission та Log collection завершувались з помилкою, хоча команди виконувались успішно

**Рішення:** Додано перевірку на ключові слова успіху в виводі команд:
- `resubmit-hip`: перевіряємо на "successful" або "success"
- `collect-log`: перевіряємо на "complete", ".tgz" або "saved to"
- `rediscover-network`: перевіряємо на "successful", "success" або "complete"

Також додано витягування шляху до файлу логів з виводу команди.

### 3. ✅ Додано опцію "Show Details"
**Нова функціональність:** Додано кнопку "Show Details" в меню для перегляду детальної інформації про з'єднання

**Реалізація:**
- Додано метод `_showConnectionDetails()` в indicator.js
- Викликає `gpClient.getDetails()` для отримання інформації
- Форматує та відображає деталі через notification
- Обробляє помилки через ErrorHandler

## Структура меню після виправлень

```
┌─────────────────────────────────┐
│ Status: Connected to vpn.epam.com│
├─────────────────────────────────┤
│ Disconnect                       │
├─────────────────────────────────┤
│ Advanced                      ▶  │
│   ├─ Rediscover Network          │
│   ├─ Resubmit HIP                │
│   └─ Collect Logs                │
├─────────────────────────────────┤
│ Show Details                     │
│ Settings                         │
└─────────────────────────────────┘
```

## Тестування

### Перевірте наступне:

1. **Settings:**
   ```bash
   # Клікніть на іконку GlobalProtect → Settings
   # Повинно відкритись вікно налаштувань
   ```

2. **Show Details:**
   ```bash
   # Підключіться до VPN
   # Клікніть на іконку → Show Details
   # Повинно з'явитись notification з деталями підключення
   ```

3. **Advanced команди:**
   ```bash
   # Клікніть на іконку → Advanced → Resubmit HIP
   # Повинно з'явитись notification про успішне виконання
   
   # Клікніть на іконку → Advanced → Collect Logs
   # Повинно з'явитись notification з шляхом до файлу логів
   
   # Клікніть на іконку → Advanced → Rediscover Network
   # Повинно з'явитись notification про успішне виконання
   ```

## Логи

Перевірте логи після тестування:
```bash
journalctl -b 0 /usr/bin/gnome-shell --since "5 minutes ago" --no-pager | grep -i globalprotect
```

Не повинно бути помилок типу:
- "Unhandled promise rejection"
- "HIP resubmission failed"
- "Log collection failed"
- "Failed to open settings"

## Наступні кроки

Розширення готове до використання. Для активації змін:

1. **На Wayland (поточна сесія):**
   - Вийдіть з сесії та увійдіть знову
   - Або виконайте: `gnome-extensions disable globalprotect@username.github.io && gnome-extensions enable globalprotect@username.github.io`

2. **Перевірте роботу:**
   ```bash
   ./test-extension-status.sh
   ```

3. **Протестуйте всі функції:**
   - Connect/Disconnect
   - Show Details
   - Settings
   - Advanced команди

## Відомі обмеження

1. На Wayland GNOME Shell не перезапускається динамічно - потрібен вихід з сесії для повного перезавантаження розширення
2. Advanced команди можуть вимагати активного VPN підключення для коректної роботи
3. Collect Logs створює файл в `~/.GlobalProtect/GlobalProtectLogs.tgz`
