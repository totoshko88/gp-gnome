# Швидкий старт GlobalProtect Extension

## Поточний статус

Розширення встановлене та увімкнене, але потребує перезапуску GNOME Shell для повного завантаження.

## Кроки для активації

### На Wayland (ваша поточна сесія):

1. **Вийдіть з сесії та увійдіть знову**
   - Натисніть на меню в правому верхньому куті
   - Виберіть "Вийти" або "Log Out"
   - Увійдіть знову

2. **Після входу перевірте статус:**
   ```bash
   ./test-extension-status.sh
   ```

3. **Шукайте іконку GlobalProtect в системному треї**
   - Іконка повинна з'явитись в правому верхньому куті панелі
   - Клікніть на неї щоб побачити меню

### Альтернативно - на X11:

Якщо ви перейдете на X11 сесію:
1. Натисніть Alt+F2
2. Введіть `r` та натисніть Enter
3. GNOME Shell перезапуститься

## Перевірка роботи

Після перезапуску Shell:

```bash
# Перевірити статус
gnome-extensions info globalprotect@username.github.io

# Подивитись логи
journalctl -b 0 /usr/bin/gnome-shell --since "1 minute ago" --no-pager | grep -i globalprotect

# Перевірити чи GlobalProtect CLI працює
globalprotect show --status
```

## Очікувана поведінка

- Іконка VPN з'явиться в системному треї
- При кліку відкриється меню з опціями:
  - Статус підключення
  - Connect/Disconnect
  - Advanced (Rediscover Network, Resubmit HIP, Collect Logs)
  - Settings

## Налаштування

Після активації відкрийте Settings щоб налаштувати portal address (за замовчуванням: vpn.epam.com)

## Troubleshooting

Якщо іконка не з'являється:

1. Перевірте логи на помилки:
   ```bash
   journalctl -b 0 /usr/bin/gnome-shell --no-pager | grep -i "error.*globalprotect"
   ```

2. Перевірте чи розширення увімкнене:
   ```bash
   gnome-extensions list | grep globalprotect
   gnome-extensions info globalprotect@username.github.io
   ```

3. Спробуйте вимкнути та увімкнути знову:
   ```bash
   gnome-extensions disable globalprotect@username.github.io
   gnome-extensions enable globalprotect@username.github.io
   ```
   Потім перезапустіть Shell (вийдіть та увійдіть)

4. Перевірте чи GlobalProtect CLI встановлений:
   ```bash
   which globalprotect
   globalprotect --version
   ```
