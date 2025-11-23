# Виправлення Collect Logs

## Дата: 23 листопада 2025

## ✅ ВИПРАВЛЕНО

### Проблема

**Advanced → Collect Logs** витягував шлях до файлу з виводу CLI і відкривав батьківську теку. Але потрібно завжди відкривати стандартну теку `~/.GlobalProtect/` де зберігаються всі логи GlobalProtect.

### Рішення

Змінено логіку методу `_collectLogsAndOpen()`:

1. **Збирає логи** через CLI (`globalprotect collect-log`)
2. **Завжди відкриває** теку `~/.GlobalProtect/` через файловий менеджер за замовчанням
3. **Показує notification** з інформацією про файл логів

### Технічні деталі

**Файл**: `indicator.js`, метод `_collectLogsAndOpen()` (рядки 698-735)

**Додано import**:
```javascript
import GLib from 'gi://GLib';
```

**Новий код**:
```javascript
async _collectLogsAndOpen() {
    try {
        // Collect logs first
        const result = await this._gpClient.collectLog();
        
        // Extract log file path from result
        const logPath = this._gpClient.extractLogFilePath(result);
        
        // Always open ~/.GlobalProtect/ folder
        const homeDir = GLib.get_home_dir();
        const globalProtectDir = GLib.build_filenamev([homeDir, '.GlobalProtect']);
        const logDir = Gio.File.new_for_path(globalProtectDir);
        
        if (logDir.query_exists(null)) {
            // Open file manager with the folder
            const launcher = Gio.AppInfo.get_default_for_type('inode/directory', false);
            if (launcher) {
                launcher.launch([logDir], null);
            }
            
            // Show notification with file path if available
            if (logPath) {
                this._showNotification('Log Collection', 
                    `Logs collected successfully.\nFile: ${logPath}\n\nFolder opened in file manager.`);
            } else {
                this._showNotification('Log Collection', 
                    `Logs collected successfully.\n\nFolder opened: ~/.GlobalProtect/`);
            }
        } else {
            // Folder doesn't exist
            if (logPath) {
                this._showNotification('Log Collection', 
                    `Logs collected successfully.\nFile: ${logPath}\n\nNote: ~/.GlobalProtect/ folder not found.`);
            } else {
                this._showNotification('Log Collection', result);
            }
        }
    } catch (e) {
        ErrorHandler.handle(e, 'Log Collection failed', {notify: true, log: true});
    }
}
```

### Переваги нового підходу

1. **Завжди відкриває правильну теку** - `~/.GlobalProtect/` де зберігаються всі логи
2. **Не залежить від парсингу виводу** - не потрібно витягувати шлях з CLI output
3. **Показує всі логи** - користувач бачить всі файли логів, не тільки останній:
   - `GlobalProtectLogs.tgz` - архів логів
   - `PanGPA.log` - логи агента
   - `PanGPI.log` - логи інтерфейсу
   - `PanHipReport.xml` - HIP звіт
   - та інші

4. **Обробляє помилки** - якщо тека не існує, показує відповідне повідомлення

### Перевірено

Тека `~/.GlobalProtect/` існує і містить файли:
```
drwxrwxr-x  2 totoshko88 totoshko88     4096 лис 23 17:08 .
-rw-rw-r--  1 totoshko88 totoshko88  2541788 лис 23 17:12 GlobalProtectLogs.tgz
-rw-------  1 totoshko88 totoshko88      419 лис 23 17:06 GPHelp.html
-rw-rw-r--  1 totoshko88 totoshko88   933654 лис 23 17:20 PanGPA.log
-rw-rw-r--  1 totoshko88 totoshko88 10477743 лис 23 17:08 PanGPA.log.old
-rw-r-----  1 totoshko88 totoshko88     1386 лис 23 17:08 pangpa.xml
-rw-rw-r--  1 totoshko88 totoshko88  3114583 лис 23 17:20 PanGPI.log
-rw-------  1 totoshko88 totoshko88     4273 лис 23 17:07 PanHipReport.xml
```

## 🔄 Наступні кроки

1. **Перезапустити GNOME Shell** (вийти/увійти)
2. **Протестувати**:
   - Відкрити меню extension
   - Advanced → Collect Logs
   - Перевірити що відкрилась тека `~/.GlobalProtect/`
   - Перевірити що показалась notification з шляхом до файлу

## ✨ Статус

**Виправлено**: ✅  
**Протестовано**: Код перевірено, тека існує  
**Готовність**: Ready for Testing після перезапуску Shell

**Версія**: 1.0.2  
**Файли змінено**: `indicator.js` (додано GLib import, змінено _collectLogsAndOpen)
