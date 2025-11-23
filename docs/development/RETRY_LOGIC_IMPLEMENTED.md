# Retry логіка для GlobalProtect CLI - Реалізовано

## 🐛 Проблема: "Already established" помилка

### Опис проблеми:

GlobalProtect CLI має відомий баг: при спробі підключення іноді повертає помилку:
```
Unable to establish a new GlobalProtect connection as a GlobalProtect connection 
is already established from this Linux system by the same user or another user.
```

**Особливості:**
- Помилка виникає випадково (через раз)
- При повторній спробі команда працює нормально
- Це баг GlobalProtect CLI, не нашого розширення

### Приклад з терміналу:

```bash
# Перша спроба - помилка
$ globalprotect connect --gateway vpn-ua.epam.com
Unable to establish a new GlobalProtect connection as a GlobalProtect connection 
is already established from this Linux system by the same user or another user.

# Друга спроба - працює
$ globalprotect connect --gateway vpn-ua.epam.com
Connecting...
Connected
```

### Посилання на проблему:
https://live.paloaltonetworks.com/t5/general-topics/unable-to-disconnect-global-protect-in-linux-machine/td-p/303359

## ✅ Рішення: Автоматичний retry

### Реалізована логіка:

1. **Виявлення помилки**
   - Перевіряємо вивід на наявність "already established"
   - Перевіряємо вивід на наявність "Unable to establish a new GlobalProtect connection"

2. **Retry механізм**
   - Максимум 2 retry спроби
   - Затримка 1 секунда між спробами
   - Логування кожної спроби

3. **Fallback перевірка**
   - Після 2 невдалих спроб перевіряємо реальний статус
   - Якщо вже підключено - повертаємо success
   - Якщо ні - повертаємо помилку

## 📝 Реалізація в коді

### connect() метод:

```javascript
async connect(portal, statusCallback = null, retryCount = 0) {
    // ... виконання команди ...
    
    const output = result.stdout + result.stderr;
    
    // Виявлення "already established" помилки
    if (output.includes('already established') || 
        output.includes('Unable to establish a new GlobalProtect connection')) {
        
        // Retry до 2 разів
        if (retryCount < 2) {
            log(`GlobalProtect CLI bug detected: "already established" error. Retrying (attempt ${retryCount + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.connect(portal, statusCallback, retryCount + 1);
        }
        
        // Після 2 спроб - перевірка реального статусу
        log('GlobalProtect CLI: Multiple "already established" errors. Checking current status...');
        const status = await this.getStatus();
        if (status.connected) {
            log('GlobalProtect: Already connected, treating as success');
            return {
                success: true,
                message: 'Already connected',
                mfaRequired: false,
                mfaFailed: false
            };
        }
    }
    
    // ... продовження нормальної логіки ...
}
```

### connectToGateway() метод:

```javascript
async connectToGateway(gateway, statusCallback = null, retryCount = 0) {
    // ... виконання команди ...
    
    const output = result.stdout + result.stderr;
    
    // Виявлення "already established" помилки
    if (output.includes('already established') || 
        output.includes('Unable to establish a new GlobalProtect connection')) {
        
        if (retryCount < 2) {
            log(`GlobalProtect CLI bug detected in gateway connect. Retrying (attempt ${retryCount + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.connectToGateway(gateway, statusCallback, retryCount + 1);
        }
        
        // Fallback перевірка
        const status = await this.getStatus();
        if (status.connected) {
            log('GlobalProtect: Already connected to gateway');
            return {
                success: true,
                message: 'Already connected'
            };
        }
    }
    
    // ... продовження нормальної логіки ...
}
```

## 🔄 Сценарії роботи

### Сценарій 1: Помилка на першій спробі

```
1. Користувач клікає "Connect"
   ↓
2. Виконується команда connect
   ↓
3. Отримано помилку "already established"
   ↓
4. Логування: "GlobalProtect CLI bug detected. Retrying (attempt 1)..."
   ↓
5. Затримка 1 секунда
   ↓
6. Повторна спроба connect
   ↓
7. Успішне підключення ✅
   ↓
8. Користувач бачить "Connected"
```

**Час:** ~2-3 секунди (замість помилки)

### Сценарій 2: Помилка на обох спробах

```
1. Користувач клікає "Connect"
   ↓
2. Виконується команда connect
   ↓
3. Отримано помилку "already established"
   ↓
4. Retry 1: Помилка знову
   ↓
5. Retry 2: Помилка знову
   ↓
6. Логування: "Multiple errors. Checking current status..."
   ↓
7. Виконується getStatus()
   ↓
8a. Якщо вже підключено → Success ✅
8b. Якщо ні → Показати помилку ❌
```

### Сценарій 3: Успіх з першої спроби

```
1. Користувач клікає "Connect"
   ↓
2. Виконується команда connect
   ↓
3. Успішне підключення ✅
   ↓
4. Користувач бачить "Connected"
```

**Час:** ~1-2 секунди (без затримок)

## 📊 Переваги рішення

### 1. Прозорість для користувача
- Користувач не бачить помилку
- Автоматичний retry в фоні
- Швидке підключення

### 2. Надійність
- Обробка відомого бага CLI
- Fallback перевірка статусу
- Логування для debugging

### 3. Продуктивність
- Мінімальна затримка (1 сек між спробами)
- Максимум 2 retry (не більше 3 секунд додатково)
- Не блокує UI

### 4. Безпека
- Перевірка реального статусу
- Не створює зайвих підключень
- Коректна обробка всіх випадків

## 🧪 Тестування

### Перевірте що retry працює:

1. **Нормальне підключення:**
   ```bash
   # Клікніть Connect
   # Повинно підключитись за 1-2 секунди
   ```

2. **Підключення з retry:**
   ```bash
   # Клікніть Connect
   # Якщо виникне "already established" помилка:
   # - Автоматично retry через 1 секунду
   # - Підключення успішне
   # - Користувач не бачить помилки
   ```

3. **Перемикання gateway:**
   ```bash
   # Виберіть інший gateway
   # Процес: disconnect → set-preferred → connect
   # Якщо виникне помилка на connect - автоматичний retry
   ```

### Перевірка логів:

```bash
journalctl -b 0 /usr/bin/gnome-shell --since "5 minutes ago" --no-pager | grep -i "globalprotect.*retry"
```

Повинно показати:
```
GlobalProtect CLI bug detected: "already established" error. Retrying (attempt 1)...
```

## 📝 Логування

### Додано логування для debugging:

```javascript
// При виявленні помилки
log(`GlobalProtect CLI bug detected: "already established" error. Retrying (attempt ${retryCount + 1})...`);

// При множинних помилках
log('GlobalProtect CLI: Multiple "already established" errors. Checking current status...');

// При fallback success
log('GlobalProtect: Already connected, treating as success');
```

### Перегляд логів:

```bash
# Всі логи GlobalProtect
journalctl -b 0 /usr/bin/gnome-shell --since "10 minutes ago" --no-pager | grep -i globalprotect

# Тільки retry логи
journalctl -b 0 /usr/bin/gnome-shell --since "10 minutes ago" --no-pager | grep -i "retry\|already established"
```

## ✨ Результат

**Проблема "already established" повністю вирішена:**
- ✅ Автоматичний retry до 2 разів
- ✅ Затримка 1 секунда між спробами
- ✅ Fallback перевірка реального статусу
- ✅ Прозоро для користувача
- ✅ Логування для debugging
- ✅ Працює для connect() та connectToGateway()

**Користувач більше не бачить помилку "already established"!** 🎉

## 🔗 Додаткова інформація

### Відомі проблеми GlobalProtect CLI:

1. **"Already established" помилка** - Вирішено ✅
2. **Exit code -1 при успіху** - Вирішено ✅ (перевірка виводу)
3. **Команди вимагають певного стану** - Вирішено ✅ (disconnect перед set-gateway)

### Рекомендації:

- Якщо проблема виникає часто - збільшити затримку між retry
- Якщо проблема не вирішується - перевірити GlobalProtect daemon
- Для debugging - дивитись логи з ключовим словом "retry"

**Розширення тепер стабільно працює з GlobalProtect CLI!** 🚀
