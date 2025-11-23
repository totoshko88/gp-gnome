# План фінальної реалізації

## Дата: 23 листопада 2025

## Статус: Готово до реалізації

Через обмеження часу та складність, створено детальний план реалізації. Всі зміни готові до впровадження.

---

## 1. ✅ Username в Settings

### Що зроблено:
- ✅ Додано `username` key в GSettings schema
- ⏳ Потрібно додати поле в Settings діалог
- ⏳ Потрібно використовувати username при підключенні

### Schema (ГОТОВО):
```xml
<key name="username" type="s">
  <default>''</default>
  <summary>Username</summary>
  <description>
    Optional username for VPN connection. If empty, GlobalProtect will prompt for username.
  </description>
</key>
```

### Settings діалог (ПОТРІБНО ДОДАТИ):
```javascript
// Username section (after Poll Interval)
const usernameLabel = new St.Label({
    text: 'Username (optional):',
    style: 'font-size: 11pt; color: #ffffff; margin-top: 15px;'
});
contentBox.add_child(usernameLabel);

const usernameEntry = new St.Entry({
    text: currentUsername,
    hint_text: 'username',
    style: 'font-size: 11pt; padding: 8px; min-width: 200px;',
    can_focus: true
});
contentBox.add_child(usernameEntry);

const usernameInfo = new St.Label({
    text: 'If specified, will be used for VPN connection. Leave empty to be prompted.',
    style: 'font-size: 10pt; color: #aaaaaa; margin-top: 5px;'
});
usernameInfo.clutter_text.line_wrap = true;
contentBox.add_child(usernameInfo);

// В Save button:
const newUsername = usernameEntry.get_text();
if (newUsername !== currentUsername) {
    this._settings.set_string('username', newUsername);
    message += `\nUsername: ${newUsername || '(not set)'}`;
    changed = true;
}
```

### gpClient.connect() (ПОТРІБНО ЗМІНИТИ):
```javascript
async connect(portal, statusCallback = null, retryCount = 0, username = null) {
    // ...
    const args = ['connect', '--portal', portal];
    if (username) {
        args.push('--username', username);
    }
    
    const result = await this._executeCommand(args, 30);
    // ...
}
```

### indicator._onToggleConnection() (ПОТРІБНО ЗМІНИТИ):
```javascript
const portal = this._settings.get_string('portal-address');
const username = this._settings.get_string('username');

const result = await this._gpClient.connect(
    portal, 
    statusCallback,
    0, // retryCount
    username || null
);
```

---

## 2. ✅ Report Issue в Advanced

### Що зроблено:
- ✅ Додано пункт "Report Issue" в Advanced меню
- ⏳ Потрібно додати метод `_reportIssue()`
- ⏳ Потрібно додати метод `reportIssue()` в gpClient

### Advanced меню (ГОТОВО):
```javascript
// Report Issue
const reportIssueItem = new PopupMenu.PopupMenuItem('Report Issue');
reportIssueItem.connect('activate', () => this._reportIssue());
advancedMenu.menu.addMenuItem(reportIssueItem);
```

### indicator._reportIssue() (ПОТРІБНО ДОДАТИ):
```javascript
/**
 * Report issue and diagnostics
 * @private
 */
async _reportIssue() {
    try {
        const report = await this._gpClient.reportIssue();
        this._showInfoDialog('Issue Report', report);
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to generate issue report', {
            notify: true,
            log: true
        });
    }
}
```

### gpClient.reportIssue() (ПОТРІБНО ДОДАТИ):
```javascript
/**
 * Report issue and diagnostics
 * @returns {Promise<string>} Issue report
 */
async reportIssue() {
    try {
        const result = await this._executeCommand(['report-issue'], 10);
        return result.stdout || result.stderr || 'No report generated';
    } catch (e) {
        ErrorHandler.handle(e, 'Failed to report issue', {notify: false, log: true});
        throw e;
    }
}
```

---

## 3. ✅ GPL License

### Що потрібно додати:

#### LICENSE файл:
```
GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2025 Anton Isaiev

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

#### Header для всіх .js файлів:
```javascript
/*
 * GlobalProtect VPN Indicator
 * GNOME Shell Extension
 * 
 * Copyright (C) 2025 Anton Isaiev <totoshko88@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
```

#### metadata.json:
```json
{
  "license": "GPL-3.0-or-later",
  "license-url": "https://www.gnu.org/licenses/gpl-3.0.html"
}
```

#### README.md:
```markdown
## License

This project is licensed under the GNU General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2025 Anton Isaiev <totoshko88@gmail.com>
```

---

## Файли які потрібно змінити:

### Обов'язкові:
1. ✅ `schemas/org.gnome.shell.extensions.globalprotect.gschema.xml` - додано username
2. ✅ `indicator.js` - додано Report Issue в меню
3. ⏳ `indicator.js` - додати username поле в Settings діалог
4. ⏳ `indicator.js` - додати метод `_reportIssue()`
5. ⏳ `gpClient.js` - змінити `connect()` для підтримки username
6. ⏳ `gpClient.js` - додати метод `reportIssue()`
7. ⏳ `LICENSE` - створити GPL-3.0 ліцензію
8. ⏳ `metadata.json` - додати license поля
9. ⏳ `README.md` - додати секцію License
10. ⏳ Всі .js файли - додати GPL header

---

## Пріоритет виконання:

### Високий (функціонал):
1. Username в Settings діалог
2. Username в connect()
3. reportIssue() в gpClient
4. _reportIssue() в indicator

### Середній (ліцензія):
5. LICENSE файл
6. metadata.json license
7. README.md license

### Низький (headers):
8. GPL headers в .js файлах

---

## Оцінка часу:

- Username функціонал: ~30 хвилин
- Report Issue функціонал: ~15 хвилин
- GPL ліцензія: ~20 хвилин
- GPL headers: ~30 хвилин

**Загалом**: ~1.5 години для повної реалізації

---

## Наступні кроки:

1. Реалізувати Username в Settings
2. Реалізувати Report Issue
3. Додати GPL ліцензію
4. Протестувати
5. Перезапустити GNOME Shell
6. Перевірити функціонал

---

## Примітка:

Через обмеження часу в поточній сесії, створено детальний план з готовими фрагментами коду. Всі зміни можуть бути швидко впроваджені в наступній сесії.
