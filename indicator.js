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

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import {ErrorHandler} from './errorHandler.js';
import {statusDotState, statusDotStyle} from './statusIndicator.js';

// Constants for delays and timeouts
const STATUS_UPDATE_DELAY_MS = 300;
const DISCONNECT_WAIT_MS = 500;
const ERROR_ICON_RESET_DELAY_MS = 3000;
const NOTIFICATION_MIN_INTERVAL_MS = 2000;

/**
 * GlobalProtectIndicator - Panel indicator for GlobalProtect VPN
 * Displays VPN status in system tray and provides menu for VPN operations
 */
export const GlobalProtectIndicator = GObject.registerClass(
class GlobalProtectIndicator extends PanelMenu.Button {
    _init(gpClient, statusMonitor, settings, extensionPath, openPreferences, versionName) {
        super._init(0.0, 'GlobalProtect Indicator');

        this._gpClient = gpClient;
        this._statusMonitor = statusMonitor;
        this._settings = settings;
        this._extensionPath = extensionPath;
        this._openPreferences = openPreferences;
        this._versionName = versionName;

        // Track signal connections for cleanup
        this._signalIds = [];

        // Track timeouts for cleanup
        this._timeoutIds = new Set();

        // Current state tracking
        this._isConnecting = false;
        this._isDisconnecting = false;
        this._isMfaWaiting = false;

        // Operation lock to prevent concurrent operations
        this._operationInProgress = false;

        // Track if non-connection operation is in progress (logs, HIP, etc.)
        this._nonConnectionOperationInProgress = false;

        // Notification throttling to prevent excessive notifications
        this._lastNotificationTime = 0;
        this._notificationMinInterval = NOTIFICATION_MIN_INTERVAL_MS;

        // Cache for gateway list and connection details
        this._gatewayListCache = null;
        this._lastGatewayUpdate = 0;
        this._connectionDetailsCache = null;

        // Track if indicator is being destroyed
        this._isDestroyed = false;

        // Create status icon
        this._icon = new St.Icon({
            style_class: 'system-status-icon globalprotect-indicator'
        });

        // Set initial icon for disconnected state
        this._setIcon('off');

        this.add_child(this._icon);

        // Build menu structure
        this._buildMenu();

        // Connect to status monitor
        const statusChangedId = this._statusMonitor.connect(
            'status-changed',
            this._onStatusChanged.bind(this)
        );
        this._signalIds.push({obj: this._statusMonitor, id: statusChangedId});

        // Initial status update
        const currentStatus = this._statusMonitor.getCurrentStatus();
        if (currentStatus) {
            this._updateIcon(currentStatus);
            this._updateMenu(currentStatus);
        }
    }

    /**
     * Delay helper using GLib.timeout_add with tracking
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     * @private
     */
    async _delay(ms) {
        return new Promise(resolve => {
            const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
                this._timeoutIds.delete(timeoutId);
                resolve();
                return GLib.SOURCE_REMOVE;
            });
            this._timeoutIds.add(timeoutId);
        });
    }

    /**
     * Add tracked timeout that will be cleaned up on destroy
     * @param {Function} callback - Function to call
     * @param {number} ms - Milliseconds to wait
     * @returns {number} Timeout ID
     * @private
     */
    _addTimeout(callback, ms) {
        const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
            this._timeoutIds.delete(timeoutId);
            callback();
            return GLib.SOURCE_REMOVE;
        });
        this._timeoutIds.add(timeoutId);
        return timeoutId;
    }

    /**
     * Show a notification with throttling to prevent excessive notifications
     * Uses Main.notify() for success/info messages
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {boolean} force - Force notification even if throttled
     * @private
     */
    _showNotification(title, message, force = false) {
        const now = Date.now();

        // Check if enough time has passed since last notification
        if (!force && (now - this._lastNotificationTime) < this._notificationMinInterval) {
            // Skip notification to avoid spam
            return;
        }

        this._lastNotificationTime = now;
        Main.notify(title, message);
    }

    /**
     * Load custom SVG icon from extension directory
     * Custom SVG icons are loaded from the icons/ directory:
     * - on.svg: Connected state
     * - off.svg: Disconnected state
     * - connecting.svg: Connecting/disconnecting/MFA waiting states
     * - error.svg: Error state
     *
     * @param {string} iconName - Icon filename without extension (e.g., 'off')
     * @private
     */
    _setIcon(iconName) {
        const iconPath = `${this._extensionPath}/icons/${iconName}.svg`;
        const file = Gio.File.new_for_path(iconPath);

        if (file.query_exists(null)) {
            const gicon = Gio.FileIcon.new(file);
            this._icon.set_gicon(gicon);
        } else {
            // Fallback to symbolic icon if custom icon not found
            console.error(`Icon not found: ${iconPath}`);
            this._icon.icon_name = 'network-vpn-disconnected-symbolic';
        }
    }

    /**
     * Build the main menu structure
     * @private
     */
    _buildMenu() {
        this._statusDot = new St.Widget({
            style_class: 'globalprotect-status-dot',
            style: statusDotStyle('disconnected'),
            y_align: Clutter.ActorAlign.CENTER
        });

        // Status label (non-reactive)
        this._statusLabel = new St.Label({
            text: 'Not connected',
            style_class: 'globalprotect-status-label globalprotect-disconnected'
        });

        const statusBox = new St.BoxLayout({
            style_class: 'globalprotect-status-row'
        });
        statusBox.add_child(this._statusDot);
        statusBox.add_child(this._statusLabel);

        const statusItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false
        });
        statusItem.actor.add_child(statusBox);
        this.menu.addMenuItem(statusItem);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Connect/Disconnect toggle button
        this._toggleItem = new PopupMenu.PopupMenuItem('Connect');
        this._toggleItem.connect('activate', this._onToggleConnection.bind(this));
        this.menu.addMenuItem(this._toggleItem);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Advanced submenu
        const advancedMenu = new PopupMenu.PopupSubMenuMenuItem('Advanced');
        advancedMenu.actor.add_style_class_name('globalprotect-advanced-menu');

        // Rediscover Network
        const rediscoverItem = new PopupMenu.PopupMenuItem('Rediscover Network');
        rediscoverItem.connect('activate', () => this._executeAdvancedCommand('rediscoverNetwork', 'Network Rediscovery'));
        advancedMenu.menu.addMenuItem(rediscoverItem);

        // Resubmit HIP
        const resubmitHipItem = new PopupMenu.PopupMenuItem('Resubmit HIP');
        resubmitHipItem.connect('activate', () => this._executeAdvancedCommand('resubmitHip', 'HIP Resubmission'));
        advancedMenu.menu.addMenuItem(resubmitHipItem);

        // Collect Logs
        const collectLogItem = new PopupMenu.PopupMenuItem('Collect Logs');
        collectLogItem.connect('activate', () => this._collectLogsAndOpen());
        advancedMenu.menu.addMenuItem(collectLogItem);

        this.menu.addMenuItem(advancedMenu);

        // Show submenu - consolidate all Show options
        const showMenu = new PopupMenu.PopupSubMenuMenuItem('Show');
        showMenu.actor.add_style_class_name('globalprotect-show-menu');

        // Show Host State (HIP information)
        const hostStateItem = new PopupMenu.PopupMenuItem('Host State');
        hostStateItem.connect('activate', () => this._showHostState());
        showMenu.menu.addMenuItem(hostStateItem);

        // Show Errors
        const errorsItem = new PopupMenu.PopupMenuItem('Errors');
        errorsItem.connect('activate', () => this._showErrors());
        showMenu.menu.addMenuItem(errorsItem);

        // Show Notifications
        const notificationsItem = new PopupMenu.PopupMenuItem('Notifications');
        notificationsItem.connect('activate', () => this._showNotifications());
        showMenu.menu.addMenuItem(notificationsItem);

        // Show Help
        const helpItem = new PopupMenu.PopupMenuItem('Help');
        helpItem.connect('activate', () => this._showHelp());
        showMenu.menu.addMenuItem(helpItem);

        // Show Version (About)
        const versionItem = new PopupMenu.PopupMenuItem('Version');
        versionItem.connect('activate', () => this._showAbout());
        showMenu.menu.addMenuItem(versionItem);

        this.menu.addMenuItem(showMenu);

        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => this._openPreferences());
        this.menu.addMenuItem(settingsItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Gateway submenu (will be populated dynamically) - at bottom for quick access
        this._gatewayMenu = new PopupMenu.PopupSubMenuMenuItem('Select Gateway');
        this._gatewayMenu.actor.add_style_class_name('globalprotect-gateway-menu');
        this.menu.addMenuItem(this._gatewayMenu);

        // Update gateway menu when menu opens
        this.menu.connect('open-state-changed', (menu, open) => {
            if (open) {
                this._updateGatewayMenu();
            }
        });
    }

    /**
     * Handle status change from monitor
     * @param {Object} _monitor - StatusMonitor instance (unused)
     * @param {Object} status - New status object
     * @private
     */
    _onStatusChanged(_monitor, status) {
        // Ignore if destroyed
        if (this._isDestroyed) {
            return;
        }

        // Don't update icon during non-connection operations (logs, HIP, etc.)
        // to prevent flickering when CLI temporarily reports wrong status
        if (!this._nonConnectionOperationInProgress) {
            this._updateIcon(status);
        }

        // Always update menu text
        this._updateMenu(status);

        // Clear transitioning states when status changes to connected/disconnected
        if (status && (status.connected || !this._isMfaWaiting)) {
            this._isConnecting = false;
            this._isDisconnecting = false;
            this._isMfaWaiting = false;

            // Clear connection details cache when status changes to force reload
            if (status.connected) {
                this._connectionDetailsCache = null;
            }

            // Load gateway list after connection is established
            if (status.connected && !this._gatewayListCache) {
                this._loadGatewayList();
            }
        }

        // Clear caches when disconnected
        if (status && !status.connected) {
            this._gatewayListCache = null;
            this._connectionDetailsCache = null;
        }
    }

    /**
     * Update icon based on connection state
     * @param {Object} status - Status object
     * @param {boolean} isError - Whether to show error icon
     * @private
     */
    _updateIcon(status, isError = false) {
        // Determine which icon to show based on state
        let iconName;

        if (isError) {
            // Error state - show error icon
            iconName = 'error';
        } else if (this._isConnecting || this._isDisconnecting || this._isMfaWaiting) {
            // Transitioning states - show connecting animation icon
            iconName = 'connecting';
        } else if (status && status.connected) {
            // Connected state - show on icon
            iconName = 'on';
        } else {
            // Disconnected state - show off icon
            iconName = 'off';
        }

        this._setIcon(iconName);
    }

    /**
     * Update the menu status dot based on connection state
     * @param {Object} status - Status object
     * @param {boolean} isError - Whether to show error state
     * @private
     */
    _updateStatusDot(status, isError = false) {
        if (!this._statusDot) return;

        const state = statusDotState({
            connected: !!(status && status.connected),
            transitioning: this._isConnecting || this._isDisconnecting || this._isMfaWaiting,
            error: isError
        });
        this._statusDot.style = statusDotStyle(state);
    }

    /**
     * Update menu labels based on connection state
     * @param {Object} status - Status object
     * @private
     */
    _updateMenu(status) {
        this._updateStatusDot(status);

        if (this._isMfaWaiting) {
            this._statusLabel.text = 'Waiting for authentication...';
            this._statusLabel.style_class = 'globalprotect-status-label globalprotect-mfa-waiting';
            this._toggleItem.label.text = 'Cancel';
        } else if (this._isConnecting) {
            this._statusLabel.text = 'Connecting...';
            this._statusLabel.style_class = 'globalprotect-status-label globalprotect-transitioning';
            this._toggleItem.label.text = 'Cancel';
        } else if (this._isDisconnecting) {
            this._statusLabel.text = 'Disconnecting...';
            this._statusLabel.style_class = 'globalprotect-status-label globalprotect-transitioning';
            this._toggleItem.label.text = 'Disconnect';
        } else if (status && status.connected) {
            // Connected state - get and cache connection details
            let statusText = 'Connected';
            if (status.portal) {
                statusText += ` to ${status.portal}`;
            }

            // Set initial text immediately
            this._statusLabel.text = statusText;
            this._statusLabel.style_class = 'globalprotect-status-label globalprotect-connected';
            this._toggleItem.label.text = 'Disconnect';

            // Get connection details asynchronously and update UI when ready
            if (!this._connectionDetailsCache && this._gpClient && this._statusMonitor) {
                // Use a timeout to prevent hanging
                Promise.race([
                    this._gpClient.getDetails(),
                    new Promise((_, reject) => {
                        const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
                            this._timeoutIds.delete(timeoutId);
                            reject(new Error('Timeout'));
                            return GLib.SOURCE_REMOVE;
                        });
                        this._timeoutIds.add(timeoutId);
                    })
                ]).then(details => {
                    console.info('gp-gnome: Got connection details:', JSON.stringify(details));
                    this._connectionDetailsCache = details;

                    // Update status text with details
                    let detailedText = statusText;
                    if (details.gateway) {
                        detailedText += `\nGateway: ${details.gateway}`;
                    }
                    if (details.assignedIp) {
                        detailedText += `\nAssigned IP: ${details.assignedIp}`;
                    }
                    if (details.gatewayIp) {
                        detailedText += `\nGateway IP: ${details.gatewayIp}`;
                    }

                    console.info('gp-gnome: Updating status text to:', detailedText);

                    // Only update if still connected and components exist
                    if (this._statusMonitor && this._statusLabel) {
                        const currentStatus = this._statusMonitor.getCurrentStatus();
                        if (currentStatus && currentStatus.connected) {
                            this._statusLabel.text = detailedText;
                        } else {
                            console.info('gp-gnome: Not updating - disconnected');
                        }
                    }
                }).catch(e => {
                    console.error('gp-gnome: Failed to get connection details:', e.message);
                });
            } else {
                // Use cached details
                const details = this._connectionDetailsCache;
                if (details.gateway) {
                    statusText += `\nGateway: ${details.gateway}`;
                }
                if (details.assignedIp) {
                    statusText += `\nAssigned IP: ${details.assignedIp}`;
                }
                if (details.gatewayIp) {
                    statusText += `\nGateway IP: ${details.gatewayIp}`;
                }
                this._statusLabel.text = statusText;
            }
        } else {
            // Disconnected state
            this._statusLabel.text = 'Not connected';
            this._statusLabel.style_class = 'globalprotect-status-label globalprotect-disconnected';
            this._toggleItem.label.text = 'Connect';

            // Clear connection details cache
            this._connectionDetailsCache = null;
        }
    }

    /**
     * Handle connect/disconnect toggle
     * @private
     */
    async _onToggleConnection() {
        // Prevent concurrent operations
        if (this._operationInProgress) {
            return;
        }

        this._operationInProgress = true;
        const status = this._statusMonitor.getCurrentStatus();

        try {
            if (status && status.connected) {
                // Disconnect
                this._isDisconnecting = true;
                this._updateIcon(status);
                this._updateMenu(status);

                await this._gpClient.disconnect();

                // Wait a bit for disconnect to complete
                await this._delay(DISCONNECT_WAIT_MS);

                // Force multiple status updates to ensure UI reflects disconnected state
                for (let i = 0; i < 3; i++) {
                    await this._statusMonitor.forceUpdate();
                    await this._delay(STATUS_UPDATE_DELAY_MS);
                }

                // Clear disconnecting state after status updates
                this._isDisconnecting = false;

                // Final UI update
                const newStatus = this._statusMonitor.getCurrentStatus();
                this._updateIcon(newStatus);
                this._updateMenu(newStatus);

                this._showNotification('GlobalProtect', 'Disconnected from VPN');
            } else {
                // Connect with MFA status callback
                this._isConnecting = true;
                this._updateIcon(status);
                this._updateMenu(status);

                const portal = this._settings.get_string('portal-address');
                const username = this._settings.get_string('username');

                // Status callback to handle MFA states
                const statusCallback = (state, message) => {
                    if (state === 'mfa-waiting') {
                        this._isConnecting = false;
                        this._isMfaWaiting = true;
                        this._updateIcon(status);
                        this._updateMenu(status);
                        // Force MFA notification as it's important
                        this._showNotification('GlobalProtect', message, true);
                    } else if (state === 'mfa-failed') {
                        this._isConnecting = false;
                        this._isMfaWaiting = false;
                        this._updateIcon(status);
                        this._updateMenu(status);
                        // Error notification will be shown by error handler
                    } else if (state === 'connected') {
                        this._isConnecting = false;
                        this._isMfaWaiting = false;
                    }
                };

                const result = await this._gpClient.connect(portal, statusCallback, 0, username || null);

                if (result.mfaRequired) {
                    // MFA is in progress, UI already updated by callback
                    // Don't clear states yet - wait for status monitor to detect connection
                } else if (result.mfaFailed) {
                    // MFA failed, states already cleared by callback
                    // Error will be thrown and handled below
                } else {
                    // Direct connection without MFA
                    this._isConnecting = false;
                    this._isMfaWaiting = false;

                    if (result.success) {
                        this._showNotification('GlobalProtect', 'Connected to VPN');
                    } else {
                        throw new Error('Connection failed');
                    }
                }
            }
        } catch (e) {
            // Clear transitioning states on error
            this._isConnecting = false;
            this._isDisconnecting = false;
            this._isMfaWaiting = false;

            // Update UI to reflect actual state
            const currentStatus = this._statusMonitor.getCurrentStatus();
            if (currentStatus) {
                this._updateIcon(currentStatus);
                this._updateMenu(currentStatus);
            }

            // Use ErrorHandler for consistent error handling
            ErrorHandler.handle(e, 'Connection toggle failed', {
                notify: true,
                log: true,
                uiCallback: () => {
                    // Show error icon
                    this._updateIcon(currentStatus, true);
                    this._updateStatusDot(currentStatus, true);

                    // Reset to normal icon after delay
                    this._addTimeout(() => {
                        this._updateIcon(this._statusMonitor.getCurrentStatus(), false);
                        this._updateStatusDot(this._statusMonitor.getCurrentStatus(), false);
                    }, ERROR_ICON_RESET_DELAY_MS);
                }
            });
        } finally {
            // Always clear operation lock
            this._operationInProgress = false;
        }
    }

    /**
     * Show information in a modal dialog with scrolling and copy button
     * @param {string} title - Dialog title
     * @param {string} content - Content to display
     * @private
     */
    _showInfoDialog(title, content) {
        // Create modal dialog
        const dialog = new ModalDialog.ModalDialog();

        // Add title
        const titleLabel = new St.Label({
            text: title,
            style_class: 'headline',
            x_align: Clutter.ActorAlign.CENTER
        });
        dialog.contentLayout.add_child(titleLabel);

        // Add scrollable content area with fixed height
        const scrollView = new St.ScrollView({
            style_class: 'globalprotect-info-scroll',
            style: 'min-width: 600px; max-width: 800px; min-height: 400px; max-height: 600px; border: 1px solid #555;',
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            overlay_scrollbars: true
        });

        const contentBox = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'globalprotect-info-content',
            style: 'padding: 20px;'
        });

        // Add content text
        const contentLabel = new St.Label({
            text: content,
            style_class: 'globalprotect-info-text',
            style: 'font-family: monospace; font-size: 10pt;'
        });
        contentLabel.clutter_text.line_wrap = true;
        contentLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
        contentLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        contentBox.add_child(contentLabel);
        scrollView.add_child(contentBox);
        dialog.contentLayout.add_child(scrollView);

        // Add Copy button
        dialog.addButton({
            label: 'Copy',
            action: () => {
                // EGO-A-005 (manual_review): clipboard access is write-only and
                // user-initiated. We only WRITE (set_text) the dialog's own
                // already-displayed `content` into the clipboard when the user
                // explicitly clicks "Copy". We never read the clipboard, never
                // access it in the background, and never copy anything the user
                // cannot already see on screen. St.Clipboard is the only GNOME
                // Shell API for this; there is no non-clipboard alternative.
                St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, content);
                this._showNotification('Copied', 'Content copied to clipboard');
            }
        });

        // Add close button
        dialog.addButton({
            label: 'Close',
            action: () => {
                dialog.close();
            },
            key: Clutter.KEY_Escape
        });

        // Open dialog
        dialog.open();
    }

    /**
     * Show host state information in a dialog
     * @private
     */
    async _showHostState() {
        if (this._isDestroyed) return;

        this._nonConnectionOperationInProgress = true;

        try {
            if (!this._gpClient) return;
            const hostState = await this._gpClient.getHostState();
            if (!this._isDestroyed) {
                this._showInfoDialog('GlobalProtect Host State', hostState);
            }
        } catch (e) {
            if (!this._isDestroyed) {
                ErrorHandler.handle(e, 'Failed to get host state', {
                    notify: true,
                    log: true
                });
            }
        } finally {
            // Wait a bit before clearing flag to let status stabilize
            if (!this._isDestroyed) {
                await this._delay(200);
            }
            this._nonConnectionOperationInProgress = false;
            // Only update icon if not destroyed
            if (!this._isDestroyed && this._statusMonitor) {
                const currentStatus = this._statusMonitor.getCurrentStatus();
                this._updateIcon(currentStatus);
            }
        }
    }

    /**
     * Execute an advanced command
     * @param {string} commandName - Method name on gpClient
     * @param {string} displayName - Human-readable command name
     * @private
     */
    async _executeAdvancedCommand(commandName, displayName) {
        // Mark that non-connection operation is in progress
        this._nonConnectionOperationInProgress = true;

        try {
            await this._gpClient[commandName]();
            this._showNotification('GlobalProtect', `${displayName} completed successfully`);
        } catch (e) {
            ErrorHandler.handle(e, `${displayName} failed`, {
                notify: true,
                log: true,
                uiCallback: () => {
                    // Show error icon briefly
                    const currentStatus = this._statusMonitor.getCurrentStatus();
                    this._updateIcon(currentStatus, true);

                    // Reset to normal icon after delay
                    this._addTimeout(() => {
                        this._updateIcon(this._statusMonitor.getCurrentStatus(), false);
                    }, ERROR_ICON_RESET_DELAY_MS);
                }
            });
        } finally {
            // Clear flag and force icon update to correct state
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
        }
    }

    /**
     * Load gateway list and cache it
     * @private
     */
    async _loadGatewayList() {
        try {
            const gateways = await this._gpClient.getGateways();
            if (gateways && gateways.length > 0) {
                this._gatewayListCache = gateways;
                this._lastGatewayUpdate = Date.now();
            }
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to load gateway list', {notify: false, log: true});
        }
    }

    /**
     * Update gateway menu with available gateways
     * @private
     */
    async _updateGatewayMenu() {
        try {
            // Clear existing items
            this._gatewayMenu.menu.removeAll();

            // Use cached gateways if available, otherwise fetch
            let gateways = this._gatewayListCache;

            if (!gateways) {
                // Try to fetch gateways
                gateways = await this._gpClient.getGateways();

                // Cache if we got results
                if (gateways && gateways.length > 0) {
                    this._gatewayListCache = gateways;
                    this._lastGatewayUpdate = Date.now();
                }
            }

            if (!gateways || gateways.length === 0) {
                const noGatewaysItem = new PopupMenu.PopupMenuItem('No gateways available', {
                    reactive: false
                });
                this._gatewayMenu.menu.addMenuItem(noGatewaysItem);

                // Add info item
                const infoItem = new PopupMenu.PopupMenuItem('Connect to VPN to see gateways');
                infoItem.connect('activate', () => {
                    this._showNotification(
                        'Gateway Selection',
                        'To see available gateways:\n\n1. Connect to VPN first\n2. Open this menu again to see all gateways\n3. Click on a gateway to switch to it'
                    );
                });
                this._gatewayMenu.menu.addMenuItem(infoItem);
                return;
            }

            // Sort gateways: current first, then preferred, then alphabetically
            gateways.sort((a, b) => {
                if (a.current && !b.current) return -1;
                if (!a.current && b.current) return 1;
                if (a.preferred && !b.preferred) return -1;
                if (!a.preferred && b.preferred) return 1;
                return a.name.localeCompare(b.name);
            });

            // Add gateway items
            for (const gateway of gateways) {
                let label = gateway.name;

                // Add indicators
                if (gateway.current) {
                    label = `✓ ${label} (current)`;
                } else if (gateway.preferred) {
                    label = `★ ${label} (preferred)`;
                }

                const gatewayItem = new PopupMenu.PopupMenuItem(label, {
                    reactive: !gateway.current
                });

                if (!gateway.current) {
                    gatewayItem.connect('activate', () => this._setGateway(gateway.address, gateway.name));
                }

                this._gatewayMenu.menu.addMenuItem(gatewayItem);
            }

            // Add separator
            this._gatewayMenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Add info about gateway count and cache status
            const cacheAge = this._lastGatewayUpdate ? Math.floor((Date.now() - this._lastGatewayUpdate) / 1000) : 0;
            const cacheInfo = cacheAge > 0 ? ` (cached ${cacheAge}s ago)` : '';
            const countItem = new PopupMenu.PopupMenuItem(`${gateways.length} gateway(s) available${cacheInfo}`, {
                reactive: false,
                style_class: 'globalprotect-gateway-info'
            });
            this._gatewayMenu.menu.addMenuItem(countItem);

            // Add refresh button
            const refreshItem = new PopupMenu.PopupMenuItem('🔄 Refresh List');
            refreshItem.connect('activate', () => {
                this._gatewayListCache = null;
                this._updateGatewayMenu();
            });
            this._gatewayMenu.menu.addMenuItem(refreshItem);

        } catch (e) {
            ErrorHandler.handle(e, 'Failed to update gateway menu', {notify: false, log: true});

            // Show error in menu
            this._gatewayMenu.menu.removeAll();
            const errorItem = new PopupMenu.PopupMenuItem('Failed to load gateways', {
                reactive: false
            });
            this._gatewayMenu.menu.addMenuItem(errorItem);

            const retryItem = new PopupMenu.PopupMenuItem('Retry');
            retryItem.connect('activate', () => this._updateGatewayMenu());
            this._gatewayMenu.menu.addMenuItem(retryItem);
        }
    }

    /**
     * Set preferred gateway and reconnect
     * @param {string} gatewayAddress - Gateway address
     * @param {string} gatewayLabel - Human-readable gateway label
     * @private
     */
    async _setGateway(gatewayAddress, gatewayLabel = gatewayAddress) {
        try {
            const currentStatus = this._statusMonitor.getCurrentStatus();

            // Set connecting state to show proper icon
            this._isConnecting = true;
            this._updateIcon(currentStatus);
            this._updateMenu(currentStatus);

            // Show notification that we're switching
            this._showNotification('Switching Gateway', `Switching to ${gatewayLabel}...`);

            // If connected, disconnect first and wait until actually disconnected
            if (currentStatus && currentStatus.connected) {
                await this._gpClient.disconnect();

                // Poll status until actually disconnected (max ~15s)
                const disconnected = await this._gpClient.waitForDisconnect();
                if (this._isDestroyed) return;

                if (!disconnected) {
                    throw new Error('Could not disconnect before switching gateway. Please try again.');
                }
            }

            // Connect to the selected gateway with portal address
            const portal = this._settings.get_string('portal-address');
            const username = this._settings.get_string('username');
            await this._gpClient.connectToGateway(gatewayAddress, null, 0, portal, username || null);

            // Invalidate caches to refresh on next open
            this._gatewayListCache = null;
            this._connectionDetailsCache = null;

            // Clear connecting state
            this._isConnecting = false;

            // Force status update by polling immediately
            await this._statusMonitor.forceUpdate();

            this._showNotification('Gateway Changed', `Successfully switched to: ${gatewayLabel}`);
        } catch (e) {
            // Clear connecting state on error
            this._isConnecting = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);

            ErrorHandler.handle(e, 'Failed to switch gateway', {notify: true, log: true});
        }
    }

    /**
     * Collect logs and open folder
     * @private
     */
    async _collectLogsAndOpen() {
        // Mark that non-connection operation is in progress
        this._nonConnectionOperationInProgress = true;

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
                    this._showNotification('Log Collection', `Logs collected successfully.\nFile: ${logPath}\n\nFolder opened in file manager.`);
                } else {
                    this._showNotification('Log Collection', 'Logs collected successfully.\n\nFolder opened: ~/.GlobalProtect/');
                }
            } else {
                // Folder doesn't exist
                if (logPath) {
                    this._showNotification('Log Collection', `Logs collected successfully.\nFile: ${logPath}\n\nNote: ~/.GlobalProtect/ folder not found.`);
                } else {
                    this._showNotification('Log Collection', result);
                }
            }
        } catch (e) {
            ErrorHandler.handle(e, 'Log Collection failed', {notify: true, log: true});
        } finally {
            // Clear flag and force icon update to correct state
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
        }
    }

    /**
     * Show help information (opens browser)
     * @private
     */
    async _showHelp() {
        this._nonConnectionOperationInProgress = true;

        try {
            // Help command opens browser, so just execute it without showing dialog
            await this._gpClient.getHelp();
            // No need to show dialog - browser will open automatically
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to open help', {notify: true, log: true});
        } finally {
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
        }
    }

    /**
     * Show errors from GlobalProtect
     * @private
     */
    async _showErrors() {
        this._nonConnectionOperationInProgress = true;

        try {
            const errors = await this._gpClient.getErrors();
            this._showInfoDialog('GlobalProtect Errors', errors);
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get errors', {notify: true, log: true});
        } finally {
            // Wait a bit before clearing flag to let status stabilize
            await this._delay(200);
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
        }
    }

    /**
     * Show notifications from GlobalProtect
     * @private
     */
    async _showNotifications() {
        this._nonConnectionOperationInProgress = true;

        try {
            const notifications = await this._gpClient.getNotifications();
            this._showInfoDialog('GlobalProtect Notifications', notifications);
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get notifications', {notify: true, log: true});
        } finally {
            // Wait a bit before clearing flag to let status stabilize
            await this._delay(200);
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
        }
    }

    /**
     * Show about information (version)
     * @private
     */
    async _showAbout() {
        this._nonConnectionOperationInProgress = true;

        try {
            const cliVersion = await this._gpClient.getVersion();
            const extVersion = this._versionName || '';
            const content = `${cliVersion}\n\n` +
                `gp-gnome ${extVersion}\n` +
                'Repository: https://github.com/totoshko88/gp-gnome\n' +
                'License: GPL-3.0-or-later';
            this._showInfoDialog('About gp-gnome', content);
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get version', {notify: true, log: true});
        } finally {
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Mark as destroyed to prevent async operations
        this._isDestroyed = true;

        // Clear references to prevent async callbacks
        this._gpClient = null;
        this._statusMonitor = null;
        this._statusLabel = null;

        // Remove all timeouts
        for (const timeoutId of this._timeoutIds) {
            try {
                GLib.source_remove(timeoutId);
            } catch (e) {
                console.error('Failed to remove timeout:', e);
            }
        }
        this._timeoutIds.clear();

        // Disconnect all signals with validation
        this._signalIds.forEach(({obj, id}) => {
            try {
                if (obj && typeof obj.disconnect === 'function' && id) {
                    obj.disconnect(id);
                }
            } catch (e) {
                console.error('Failed to disconnect signal:', e);
            }
        });
        this._signalIds = [];

        // Call parent destroy
        super.destroy();
    }
});
