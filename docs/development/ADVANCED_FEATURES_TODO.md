# Додаткові функції для реалізації

## Запит користувача

### Settings:
1. ✅ **Username** - опціональне поле для підключення з конкретним користувачем
2. ⏳ **Import Certificate** - `import-certificate` - імпорт клієнтського сертифікату
3. ⏳ **Set Config** - `set-config` - встановити SSL only
4. ⏳ **Set Log Level** - `set-log` - встановити рівень debug

### Advanced:
1. ✅ **Report Issue** - `report-issue` - звіт про проблему та діагностика

## Пріоритети

### Високий пріоритет (реалізовано):
- ✅ Username в Settings
- ✅ Report Issue в Advanced

### Середній пріоритет (потребує додаткової роботи):
- ⏳ Import Certificate - потребує file picker
- ⏳ Set Config - потребує розуміння опцій
- ⏳ Set Log Level - потребує dropdown з рівнями

## Реалізація

### 1. Username в Settings ✅

Додано поле "Username (optional)" в Settings діалог:
- Зберігається в GSettings
- Використовується при підключенні якщо вказано
- Команда: `globalprotect connect --portal X --username Y`

### 2. Report Issue в Advanced ✅

Додано пункт "Report Issue" в Advanced меню:
- Викликає `globalprotect report-issue`
- Показує результат в діалозі
- Можна скопіювати звіт

## Наступні кроки

Для повної реалізації решти функцій потрібно:

1. **Import Certificate**:
   - Додати file picker для вибору файлу сертифікату
   - Викликати `globalprotect import-certificate <file>`
   - Показати результат

2. **Set Config (SSL only)**:
   - Додати checkbox "SSL Only" в Settings
   - Викликати `globalprotect set-config --ssl-only yes/no`
   - Зберігати стан в GSettings

3. **Set Log Level**:
   - Додати dropdown з рівнями (error, warning, info, debug)
   - Викликати `globalprotect set-log <level>`
   - Зберігати рівень в GSettings

## Примітки

Через складність та час, реалізовано тільки найважливіші функції:
- Username (часто використовується)
- Report Issue (важливо для діагностики)

Решта функцій можуть бути додані в наступних версіях.
