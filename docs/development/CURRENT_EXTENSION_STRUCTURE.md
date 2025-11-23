# Поточна структура GlobalProtect Extension - Повний опис

## 📊 Загальна інформація

**Назва:** GlobalProtect VPN Indicator  
**UUID:** globalprotect@username.github.io  
**Версія:** 1.0  
**Підтримка GNOME Shell:** 45, 46, 47, 48, 49  
**Мова:** JavaScript (GJS)  
**Тип:** GNOME Shell Extension для управління GlobalProtect VPN CLI

## 🗂️ Структура файлів проекту

```
gnome-globalprotect-extension/
├── 📄 extension.js              # Головний файл extension (Extension class)
├── 📄 indicator.js              # UI компонент - індикатор в системному треї
├── 📄 gpClient.js               # Wrapper для GlobalProtect CLI команд
├── 📄 statusMonitor.js          # Моніторинг стану VPN підключення
├── 📄 errorHandler.js           # Централізована обробка помилок
├── 📄 prefs.js                  # UI налаштувань extension
├── 📄 metadata.json             # Метадані extension
├── 📄 stylesheet.css            # Стилі для UI
│
├── 📁 schemas/                  # GSettings схеми
│   └── org.gnome.shell.extensions.globalprotect.gschema.xml
│
├── 📁 icons/                    # Іконки для різних станів
│   ├── on.png                   # Підключено
│   ├── off.png                  # Відключено
│   ├── connecting.png           # Підключення/MFA
│   └── error.png                # Помилка
│
├── 📁 tests/                    # Тести
│   ├── run-unit-tests.js        # Unit тести
│   ├── run-property-tests.js    # Property-based тести
│   ├── test-cli-integration.sh  # Інтеграційні тести
│   ├── validate-review-guidelines.sh
│   ├── 📁 properties/           # Property-based тести
│   ├── 📁 spec/                 # Unit тести
│   └── 📁 mocks/                # Mock об'єкти для тестів
│
├── 📁 .github/                  # GitHub конфігурація
│   ├── workflows/
│   │   ├── ci.yml               # CI pipeline
│   │   └── release.yml          # Release automation
│   └── ISSUE_TEMPLATE/
│
├── 📁 docs/                     # Документація
│   └── screenshots/
│
├── 📄 README.md                 # Основна документація
├── 📄 CHANGELOG.md              # Історія змін
├── 📄 CONTRIBUTING.md           # Гайд для контриб'юторів
├── 📄 DISTRIBUTION.md           # Інструкції для розповсюдження
├── 📄 MANUAL_TESTING_GUIDE.md   # Посібник з тестування
├── 📄 LICENSE                   # Ліцензія
│
├── 📄 Makefile                  # Автоматизація збірки
├── 📄 install.sh                # Скрипт встановлення
├── 📄 uninstall.sh              # Скрипт видалення
└── 📄 package.json              # NPM конфігурація для тестів
```

## 🎯 Архітектура компонентів

### 1. Extension (extension.js)
**Призначення:** Головний клас, управляє lifecycle extension

**Методи:**
- `enable()` - Ініціалізація та запуск extension
- `disable()` - Очищення ресурсів та зупинка

**Відповідальність:**
- Створення всіх компонентів (gpClient, statusMonitor, indicator)
- Додавання індикатора в панель
- Запуск моніторингу статусу
- Очищення при вимкненні

### 2. GlobalProtectIndicator (indicator.js)
**Призначення:** UI компонент в системному треї

**Основні елементи:**
- Іконка статусу (змінюється залежно від стану)
- Спливаюче меню з опціями
- Обробка подій користувача

**Методи (публічні):**
- `_buildMenu()` - Побудова структури меню
- `_updateIcon()` - Оновлення іконки статусу
- `_onToggleConnection()` - Обробка підключення/відключення
- `destroy()` - Очищення ресурсів

**Методи (приватні):**
- `_showConnectionDetails()` - Показ деталей підключення
- `_showHIPState()` - Показ HIP інформації
- `_showErrors()` - Показ помилок
- `_showNotifications()` - Показ сповіщень
- `_showHelp()` - Показ довідки
- `_showAbout()` - Показ версії
- `_changePortal()` - Зміна порталу
- `_openSettings()` - Відкриття налаштувань
- `_clearCredentials()` - Очищення credentials
- `_updateGatewayMenu()` - Оновлення меню шлюзів
- `_setGateway()` - Встановлення preferred gateway
- `_collectLogsAndOpen()` - Збір логів + відкриття теки
- `_executeAdvancedCommand()` - Виконання advanced команд

### 3. GlobalProtectClient (gpClient.js)
**Призначення:** Wrapper для GlobalProtect CLI команд

**Основні методи:**

#### Підключення та відключення:
- `connect(portal, statusCallback)` - Підключення до порталу
- `connectToGateway(gateway, statusCallback)` - Підключення до шлюзу
- `disconnect()` - Відключення від VPN

#### Отримання інформації:
- `getStatus()` - Поточний статус підключення
- `getDetails()` - Детальна інформація про з'єднання
- `getGateways()` - Список доступних шлюзів
- `getVersion()` - Версія GlobalProtect
- `getErrors()` - Помилки GlobalProtect
- `getHostState()` - HIP інформація
- `getNotifications()` - Сповіщення GlobalProtect
- `getHelp()` - Довідка CLI

#### Управління:
- `setPreferredGateway(gateway)` - Встановлення preferred gateway
- `rediscoverNetwork()` - Перевідкриття мережі
- `resubmitHip()` - Повторна відправка HIP
- `collectLog()` - Збір логів
- `removeUser()` - Очищення credentials

#### Допоміжні:
- `isCommandAvailable()` - Перевірка доступності CLI
- `extractLogFilePath(output)` - Витягування шляху до логів
- `_executeCommand(args, timeout)` - Виконання CLI команди

### 4. StatusMonitor (statusMonitor.js)
**Призначення:** Моніторинг стану VPN підключення

**Функціонал:**
- Періодичне опитування статусу (кожні 5 секунд)
- Емісія сигналу при зміні статусу
- Кешування поточного статусу

**Методи:**
- `start()` - Запуск моніторингу
- `stop()` - Зупинка моніторингу
- `getCurrentStatus()` - Отримання поточного статусу
- `_poll()` - Опитування статусу

**Сигнали:**
- `status-changed` - Емітується при зміні статусу

### 5. ErrorHandler (errorHandler.js)
**Призначення:** Централізована обробка помилок

**Функціонал:**
- Логування помилок
- Показ notification користувачу
- Sanitization чутливих даних
- Оновлення UI при помилках

**Методи:**
- `handle(error, context, options)` - Обробка помилки
- `wrapAsync(asyncFn, context)` - Обгортка для async функцій
- `_getUserMessage(error)` - Генерація user-friendly повідомлення
- `_sanitizeForLog(message)` - Видалення чутливих даних

## 📋 Структура меню (детально)

### Верхній рівень меню:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Status: Connected to vpn.epam.com                    │
│    (Динамічний статус, оновлюється кожні 5 секунд)     │
├─────────────────────────────────────────────────────────┤
│ 🔌 Disconnect                                           │
│    Дія: Відключення від VPN                            │
│    Команда: globalprotect disconnect                    │
├─────────────────────────────────────────────────────────┤
│ 🔧 Advanced                                          ▶  │
│ 👁️ Show                                              ▶  │
│ ⚙️ Settings                                          ▶  │
├─────────────────────────────────────────────────────────┤
│ 🌐 Select Gateway                                    ▶  │
│    (Найчастіше використовується - внизу для доступу)   │
└─────────────────────────────────────────────────────────┘
```

### 1️⃣ Advanced ▶ (Розширені операції)

```
Advanced
├─ 🔄 Rediscover Network
│  Дія: Перевідкриття мережі (disconnect + reconnect)
│  Команда: globalprotect rediscover-network
│  Використання: При проблемах з мережею
│
├─ 🏥 Resubmit HIP
│  Дія: Повторна відправка HIP інформації
│  Команда: globalprotect resubmit-hip
│  Використання: Після виправлення compliance issues
│
└─ 📦 Collect Logs
   Дія: Збір логів + відкриття теки
   Команда: globalprotect collect-log
   Результат: Відкривається ~/.GlobalProtect/ в файловому менеджері
   Файл: GlobalProtectLogs.tgz
```

### 2️⃣ Show ▶ (Перегляд інформації)

```
Show
├─ 📊 Connection Details
│  Дія: Показ детальної інформації про з'єднання
│  Команда: globalprotect show --details
│  Показує: Gateway Name, IP, Protocol, Uptime, тощо
│
├─ 🏥 HIP State
│  Дія: Показ HIP інформації про endpoint
│  Команда: globalprotect show --host-state
│  Показує: OS, hostname, network interfaces, тощо
│
├─ ❌ Errors
│  Дія: Показ помилок GlobalProtect
│  Команда: globalprotect show --error
│  Показує: Останні помилки або "No errors reported"
│
├─ 🔔 Notifications
│  Дія: Показ сповіщень GlobalProtect
│  Команда: globalprotect show --notification
│  Показує: Сповіщення від GlobalProtect або "No notifications"
│
├─ ❓ Help
│  Дія: Показ довідки GlobalProtect CLI
│  Команда: globalprotect show --help
│  Показує: Список всіх доступних команд та опцій
│
└─ ℹ️ Version
   Дія: Показ версії GlobalProtect та Extension
   Команда: globalprotect show --version
   Показує: 
   - Версія GlobalProtect CLI
   - Версія GNOME Shell Extension (1.0)
   - Copyright інформація
```

### 3️⃣ Settings ▶ (Налаштування)

```
Settings
├─ 🌐 Change Portal...
│  Дія: Зміна адреси VPN порталу
│  Показує: Поточний портал + інструкції для зміни
│  Методи зміни:
│  1. Via terminal: gsettings set ... portal-address "new.portal.com"
│  2. Via GUI: gnome-extensions prefs globalprotect@username.github.io
│
├─ ⚙️ Configure...
│  Дія: Відкриття налаштувань extension
│  Показує: Поточні налаштування + інструкції
│  Налаштування:
│  - Portal address (за замовчуванням: vpn.epam.com)
│  - Poll interval (за замовчуванням: 5 секунд)
│
└─ 🗑️ Clear Credentials
   Дія: Очищення збережених credentials
   Команда: globalprotect remove-user
   Примітка: Потребує підтвердження (y/n) в терміналі
   Показує: Інструкції для виконання команди
```

### 4️⃣ Select Gateway ▶ (Вибір шлюзу)

```
Select Gateway
├─ ✓ vpn-eu.epam.com (current)
│  Статус: Поточний підключений шлюз
│  Дія: Неактивний (вже підключено)
│
├─ vpn-us.epam.com
│  Дія: Встановити як preferred gateway
│  Команда: globalprotect set-preferred-gateway vpn-us.epam.com
│  Результат: При наступному підключенні буде використано цей шлюз
│
├─ vpn-cn.epam.com
├─ vpn-ua.epam.com
├─ vpn-in.epam.com
├─ vpn-eu2.epam.com
├─ vpn-by-minsk.epam.com
├─ vpn-by.epam.com
│  (Аналогічно до vpn-us.epam.com)
│
├─ ─────────────────────
│
└─ 📊 8 gateway(s) available
   Статус: Інформаційний рядок
   Дія: Неактивний

Примітки:
- ✓ - Поточний підключений шлюз
- ★ - Preferred шлюз (якщо встановлено)
- Сортування: current → preferred → alphabetical
- Команда для отримання списку: globalprotect show --manual-gateway
```

## 🎨 Стани іконки

### Іконки в системному треї:

| Стан | Іконка | Файл | Опис |
|------|--------|------|------|
| Підключено | 🟢 | icons/on.png | VPN активний |
| Відключено | 🔴 | icons/off.png | VPN неактивний |
| Підключення | 🟡 | icons/connecting.png | Процес підключення або MFA |
| Помилка | ⚠️ | icons/error.png | Помилка підключення |

### Стани підключення:

1. **Disconnected** (Відключено)
   - Іконка: off.png
   - Кнопка: "Connect"
   - Колір статусу: червоний

2. **Connecting** (Підключення)
   - Іконка: connecting.png
   - Кнопка: "Connecting..." (неактивна)
   - Колір статусу: жовтий

3. **MFA Waiting** (Очікування MFA)
   - Іконка: connecting.png
   - Статус: "Waiting for authentication..."
   - Колір статусу: жовтий

4. **Connected** (Підключено)
   - Іконка: on.png
   - Кнопка: "Disconnect"
   - Статус: "Connected to [portal]"
   - Колір статусу: зелений

5. **Error** (Помилка)
   - Іконка: error.png
   - Показується notification з помилкою
   - Автоматично повертається до нормальної іконки через 3 сек

## ⚙️ Налаштування (GSettings)

### Схема: org.gnome.shell.extensions.globalprotect

```xml
<key name="portal-address" type="s">
  <default>'vpn.epam.com'</default>
  <summary>VPN Portal Address</summary>
  <description>The address of the GlobalProtect VPN portal to connect to</description>
</key>

<key name="poll-interval" type="i">
  <default>5</default>
  <range min="3" max="60"/>
  <summary>Status Poll Interval</summary>
  <description>How often to check VPN connection status (in seconds)</description>
</key>
```

### Доступ до налаштувань:

**Через gsettings (terminal):**
```bash
# Отримати значення
gsettings get org.gnome.shell.extensions.globalprotect portal-address
gsettings get org.gnome.shell.extensions.globalprotect poll-interval

# Встановити значення
gsettings set org.gnome.shell.extensions.globalprotect portal-address "vpn.example.com"
gsettings set org.gnome.shell.extensions.globalprotect poll-interval 10
```

**Через GUI:**
```bash
gnome-extensions prefs globalprotect@username.github.io
```

## 🔄 Lifecycle Extension

### Enable (Увімкнення):

```
1. extension.enable() викликається GNOME Shell
   ↓
2. Завантаження GSettings
   ↓
3. Створення GlobalProtectClient
   ↓
4. Створення StatusMonitor
   ↓
5. Створення GlobalProtectIndicator
   ↓
6. Додавання індикатора в панель
   ↓
7. Запуск моніторингу статусу
   ↓
8. Extension активний ✅
```

### Disable (Вимкнення):

```
1. extension.disable() викликається GNOME Shell
   ↓
2. Зупинка StatusMonitor
   ↓
3. Видалення всіх timeouts
   ↓
4. Відключення всіх signal handlers
   ↓
5. Видалення індикатора з панелі
   ↓
6. Очищення всіх посилань (= null)
   ↓
7. Extension вимкнений ✅
```

## 🧪 Тестування

### Unit Tests (18 тестів):
- Валідація portal address
- Парсинг статусу
- Побудова команд
- Вибір іконок
- Sanitization помилок
- Форматування деталей

### Property-Based Tests (13 властивостей):
- Settings persistence
- Portal validation
- Icon state correspondence
- Status parsing completeness
- Connect command parameters
- Error handling
- State transitions
- Connection details
- Advanced commands
- Subprocess output
- Resource cleanup
- Command availability
- Error sanitization

### Integration Tests:
- GlobalProtect CLI availability
- Виконання команд
- Парсинг виводу
- Файлова структура

## 📊 Статистика

### Покриття функціоналу:
- **GlobalProtect CLI команд:** 83% (15/18)
- **Основні функції:** 100%
- **Розширені функції:** 90%
- **Інформаційні команди:** 100%

### Розмір коду:
- **extension.js:** ~80 рядків
- **indicator.js:** ~750 рядків
- **gpClient.js:** ~600 рядків
- **statusMonitor.js:** ~100 рядків
- **errorHandler.js:** ~200 рядків
- **prefs.js:** ~150 рядків
- **Всього:** ~1880 рядків коду

### Тести:
- **Unit tests:** 18 тестів
- **Property tests:** 13 властивостей
- **Integration tests:** 20+ перевірок
- **Всього:** 50+ тестів

## 🚀 Використання

### Встановлення:
```bash
make install
gnome-extensions enable globalprotect@username.github.io
# Перезапустити GNOME Shell (вийти/увійти на Wayland)
```

### Видалення:
```bash
./uninstall.sh
```

### Тестування:
```bash
# Unit tests
gjs tests/run-unit-tests.js

# Property tests
gjs tests/run-property-tests.js

# Integration tests
bash tests/test-cli-integration.sh

# Review guidelines
bash tests/validate-review-guidelines.sh
```

## ✨ Підсумок

**GlobalProtect Extension - повнофункціональне розширення для GNOME Shell з:**
- ✅ 21 функція в меню
- ✅ 15 GlobalProtect CLI команд
- ✅ 4 стани іконки
- ✅ 2 налаштування
- ✅ 50+ тестів
- ✅ Повна документація
- ✅ Безпечна реалізація без крашів

**Готове до використання та розповсюдження!** 🎉
