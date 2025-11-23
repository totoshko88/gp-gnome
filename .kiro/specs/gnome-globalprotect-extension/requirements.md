# Requirements Document

## Introduction

Цей документ описує вимоги до GNOME Shell Extension для управління GlobalProtect VPN через CLI інтерфейс. Extension надає графічний інтерфейс користувача для взаємодії з GlobalProtect CLI, що вже встановлена на системі, дозволяючи швидко підключатися/відключатися від VPN та моніторити поточний стан з'єднання.

## Glossary

- **Extension**: GNOME Shell Extension - розширення для GNOME Shell
- **GlobalProtect CLI**: Command-line interface для GlobalProtect VPN клієнта
- **Portal**: VPN сервер/портал для підключення (наприклад, vpn.epam.com)
- **System**: GNOME GlobalProtect Extension
- **User**: Користувач системи GNOME
- **Status Indicator**: Візуальний індикатор в системному треї
- **MFA**: Multi-Factor Authentication - багатофакторна автентифікація

## Requirements

### Requirement 1

**User Story:** Як користувач, я хочу зберігати налаштування порталу VPN в конфігурації extension, щоб не вводити адресу порталу кожного разу при підключенні.

#### Acceptance Criteria

1. WHEN the User opens extension settings, THEN the System SHALL display a configuration interface for portal address
2. WHEN the User enters a portal address and saves settings, THEN the System SHALL persist the portal address to extension configuration storage
3. WHEN the System starts, THEN the System SHALL load the saved portal address from configuration storage
4. WHEN the User modifies the portal address, THEN the System SHALL validate the format before saving
5. WHERE the User has not configured a portal address, the System SHALL use "vpn.epam.com" as the default value

### Requirement 2

**User Story:** Як користувач, я хочу бачити поточний стан VPN підключення в системному треї, щоб швидко визначити чи активне з'єднання.

#### Acceptance Criteria

1. WHEN the VPN connection is active, THEN the System SHALL display the VPN-connected icon in the status indicator
2. WHEN the VPN connection is inactive, THEN the System SHALL display the VPN-disconnected icon in the status indicator
3. WHEN the System queries connection status, THEN the System SHALL execute "globalprotect show --status" command
4. WHEN the System receives status information, THEN the System SHALL parse the output and update the status indicator within 2 seconds
5. WHILE the Extension is active, the System SHALL poll connection status every 5 seconds

### Requirement 3

**User Story:** Як користувач, я хочу підключатися до VPN через extension, щоб не використовувати командний рядок вручну.

#### Acceptance Criteria

1. WHEN the User clicks the status indicator while disconnected, THEN the System SHALL display a connect option
2. WHEN the User selects connect option, THEN the System SHALL execute "globalprotect connect --portal <configured_portal>" command
3. WHEN the connect command is executing, THEN the System SHALL display a connecting state in the status indicator
4. IF the connection fails, THEN the System SHALL display an error notification to the User
5. WHEN the connection succeeds, THEN the System SHALL update the status indicator to connected state

### Requirement 4

**User Story:** Як користувач, я хочу відключатися від VPN через extension, щоб швидко завершити VPN сесію.

#### Acceptance Criteria

1. WHEN the User clicks the status indicator while connected, THEN the System SHALL display a disconnect option
2. WHEN the User selects disconnect option, THEN the System SHALL execute "globalprotect disconnect" command
3. WHEN the disconnect command is executing, THEN the System SHALL display a disconnecting state in the status indicator
4. IF the disconnect fails, THEN the System SHALL display an error notification to the User
5. WHEN the disconnect succeeds, THEN the System SHALL update the status indicator to disconnected state

### Requirement 5

**User Story:** Як користувач, я хочу бачити детальну інформацію про поточне з'єднання, щоб знати до якого порталу я підключений та інші параметри.

#### Acceptance Criteria

1. WHEN the User opens the extension menu, THEN the System SHALL display current connection details including portal address and gateway
2. WHEN the System queries detailed information, THEN the System SHALL execute "globalprotect show --details" command
3. WHEN connection details are unavailable, THEN the System SHALL display "Not connected" message
4. WHEN the System displays connection information, THEN the System SHALL include connection status, portal, and gateway information
5. WHEN the User requests connection details while disconnected, THEN the System SHALL display only the configured portal address

### Requirement 6

**User Story:** Як користувач, я хочу виконувати додаткові операції GlobalProtect, щоб мати повний контроль над VPN клієнтом.

#### Acceptance Criteria

1. WHEN the User opens advanced options menu, THEN the System SHALL display options for network rediscovery, HIP resubmission, and log collection
2. WHEN the User selects network rediscovery, THEN the System SHALL execute "globalprotect rediscover-network" command
3. WHEN the User selects HIP resubmission, THEN the System SHALL execute "globalprotect resubmit-hip" command
4. WHEN the User selects log collection, THEN the System SHALL execute "globalprotect collect-log" command
5. WHEN any advanced command completes, THEN the System SHALL display a notification with the operation result

### Requirement 7

**User Story:** Як користувач, я хочу щоб extension використовував кастомні іконки для відображення стану VPN, щоб чітко бачити поточний статус підключення.

#### Acceptance Criteria

1. WHEN the System displays VPN connected state, THEN the System SHALL use icon from "/home/totoshko88/Documents/gp-gnome/icons/on.png"
2. WHEN the System displays VPN disconnected state, THEN the System SHALL use icon from "/home/totoshko88/Documents/gp-gnome/icons/off.png"
3. WHEN the System displays connecting/disconnecting state, THEN the System SHALL use icon from "/home/totoshko88/Documents/gp-gnome/icons/connecting.png"
4. WHEN the System encounters connection error, THEN the System SHALL use icon from "/home/totoshko88/Documents/gp-gnome/icons/error.png"
5. WHEN the System renders UI elements, THEN the System SHALL follow GNOME HIG (Human Interface Guidelines)
6. WHEN the System displays notifications, THEN the System SHALL use GNOME notification system

### Requirement 8

**User Story:** Як користувач, я хочу щоб extension коректно працював з MFA автентифікацією через браузер, щоб безпечно підключатися до корпоративного VPN.

#### Acceptance Criteria

1. WHEN the GlobalProtect CLI requires MFA authentication, THEN the System SHALL allow the authentication flow to proceed through browser
2. WHEN MFA authentication is in progress, THEN the System SHALL display "Waiting for authentication" status
3. WHEN MFA authentication completes successfully, THEN the System SHALL update connection status to connected
4. IF MFA authentication fails or times out, THEN the System SHALL display an error notification
5. WHEN the System executes connect command, THEN the System SHALL not block the authentication browser window

### Requirement 9

**User Story:** Як користувач, я хочу щоб extension виконував команди GlobalProtect безпечно через subprocess, щоб уникнути проблем з безпекою та стабільністю.

#### Acceptance Criteria

1. WHEN the System executes any GlobalProtect command, THEN the System SHALL use Gio.Subprocess API
2. WHEN the System spawns a subprocess, THEN the System SHALL set appropriate timeout values for command execution
3. WHEN a subprocess fails to execute, THEN the System SHALL handle the error gracefully and notify the User
4. WHEN the System reads subprocess output, THEN the System SHALL parse stdout and stderr separately
5. WHEN a subprocess times out, THEN the System SHALL terminate the process and display a timeout error

### Requirement 10

**User Story:** Як користувач, я хочу щоб extension відповідав вимогам GNOME Extension Review Guidelines, щоб він був якісним та міг бути опублікований.

#### Acceptance Criteria

1. WHEN the Extension is packaged, THEN the System SHALL include valid metadata.json with all required fields
2. WHEN the Extension code is reviewed, THEN the System SHALL not use synchronous operations that block the main thread
3. WHEN the Extension is enabled, THEN the System SHALL properly clean up resources in disable() method
4. WHEN the Extension uses external commands, THEN the System SHALL check for command availability before execution
5. WHEN the Extension handles errors, THEN the System SHALL log errors appropriately without exposing sensitive information
