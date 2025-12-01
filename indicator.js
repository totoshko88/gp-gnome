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

// Constants for delays and timeouts
const STATUS_UPDATE_DELAY_MS = 300;
const DISCONNECT_WAIT_MS = 500;
const GATEWAY_SWITCH_DISCONNECT_WAIT_MS = 2000;
const ERROR_ICON_RESET_DELAY_MS = 3000;
const NOTIFICATION_MIN_INTERVAL_MS = 2000;

/**
 * GlobalProtectIndicator - Panel indicator for GlobalProtect VPN
 * Displays VPN status in system tray and provides menu for VPN operations
 */
export const GlobalProtectIndicator = GObject.registerClass(
class GlobalProtectIndicator extends PanelMenu.Button {
    _init(gpClient, statusMonitor, settings, extensionPath) {
        super._init(0.0, 'GlobalProtect Indicator');
        
        // Store references
        this._gpClient = gpClient;
        this._statusMonitor = statusMonitor;
        this._settings = settings;
        this._extensionPath = extensionPath;
        
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
        this._signalIds.push({ obj: this._statusMonitor, id: statusChangedId });
        
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
        // Status label (non-reactive)
        this._statusLabel = new St.Label({
            text: 'Not connected',
            style_class: 'globalprotect-status-label globalprotect-disconnected'
        });
        
        const statusItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            can_focus: false
        });
        statusItem.actor.add_child(this._statusLabel);
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
        
        // Report Issue
        const reportIssueItem = new PopupMenu.PopupMenuItem('Report Issue');
        reportIssueItem.connect('activate', () => this._reportIssue());
        advancedMenu.menu.addMenuItem(reportIssueItem);
        
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
        
        // Settings - single menu item that opens comprehensive settings dialog
        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => this._openSettingsDialog());
        this.menu.addMenuItem(settingsItem);
        
        // Separator before Gateway (most used feature at bottom for easy access)
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
            
            // Load gateway list after connection is established
            if (status.connected && !this._gatewayListCache) {
                this._loadGatewayList();
            }
        }
        
        // Clear gateway cache when disconnected
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
     * Update menu labels based on connection state
     * @param {Object} status - Status object
     * @private
     */
    async _updateMenu(status) {
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
            
            // Get connection details and show gateway info
            if (!this._connectionDetailsCache) {
                try {
                    this._connectionDetailsCache = await this._gpClient.getConnectionDetails();
                } catch (e) {
                    // Ignore errors, just don't cache
                }
            }
            
            if (this._connectionDetailsCache) {
                const details = this._connectionDetailsCache;
                if (details.gatewayName) {
                    statusText += `\nGateway: ${details.gatewayName}`;
                }
                if (details.assignedIp) {
                    statusText += `\nAssigned IP: ${details.assignedIp}`;
                }
                if (details.gatewayIp) {
                    statusText += `\nGateway IP: ${details.gatewayIp}`;
                }
            }
            
            this._statusLabel.text = statusText;
            this._statusLabel.style_class = 'globalprotect-status-label globalprotect-connected';
            this._toggleItem.label.text = 'Disconnect';
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
                    
                    // Reset to normal icon after delay
                    this._addTimeout(() => {
                        this._updateIcon(this._statusMonitor.getCurrentStatus(), false);
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
            vertical: true,
            style_class: 'globalprotect-info-content',
            style: 'padding: 20px;'
        });
        
        // Add content text
        const contentLabel = new St.Label({
            text: content,
            style_class: 'globalprotect-info-text',
            style: 'font-family: monospace; font-size: 10pt; color: #ffffff;'
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
                // Copy content to clipboard
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
        this._nonConnectionOperationInProgress = true;
        
        try {
            const hostState = await this._gpClient.getHostState();
            this._showInfoDialog('GlobalProtect Host State', hostState);
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get host state', {
                notify: true,
                log: true
            });
        } finally {
            this._nonConnectionOperationInProgress = false;
            const currentStatus = this._statusMonitor.getCurrentStatus();
            this._updateIcon(currentStatus);
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
     * Change portal address with interactive dialog
     * @private
     */
    _changePortal() {
        const currentPortal = this._settings.get_string('portal-address');
            
            // Create modal dialog
            const dialog = new ModalDialog.ModalDialog();
            
            // Add title
            const titleLabel = new St.Label({
                text: 'Change Portal',
                style_class: 'headline',
                x_align: Clutter.ActorAlign.CENTER
            });
            dialog.contentLayout.add_child(titleLabel);
            
            // Add content box
            const contentBox = new St.BoxLayout({
                vertical: true,
                style: 'padding: 20px; spacing: 15px; min-width: 500px;'
            });
            
            // Current portal label
            const currentLabel = new St.Label({
                text: `Current portal: ${currentPortal}`,
                style: 'font-size: 11pt; color: #ffffff;'
            });
            contentBox.add_child(currentLabel);
            
            // New portal label
            const newLabel = new St.Label({
                text: 'New portal address:',
                style: 'font-size: 11pt; color: #ffffff; margin-top: 10px;'
            });
            contentBox.add_child(newLabel);
            
            // Portal input field
            const portalEntry = new St.Entry({
                text: currentPortal,
                hint_text: 'vpn.example.com',
                style: 'font-size: 11pt; padding: 8px; min-width: 400px;',
                can_focus: true
            });
            contentBox.add_child(portalEntry);
            
            // Info label
            const infoLabel = new St.Label({
                text: 'After changing, reconnect to VPN.',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 10px;'
            });
            contentBox.add_child(infoLabel);
            
            dialog.contentLayout.add_child(contentBox);
            
            // Add Save button
            dialog.addButton({
                label: 'Save',
                action: () => {
                    const newPortal = portalEntry.get_text();
                    if (newPortal && newPortal !== currentPortal) {
                        this._settings.set_string('portal-address', newPortal);
                        this._showNotification('Portal Changed', `Portal set to: ${newPortal}\n\nReconnect to VPN to use new portal.`);
                    }
                    dialog.close();
                },
                key: Clutter.KEY_Return
            });
            
            // Add Cancel button
            dialog.addButton({
                label: 'Cancel',
                action: () => {
                    dialog.close();
                },
                key: Clutter.KEY_Escape
            });
            
            // Open dialog and focus input
            dialog.open();
            global.stage.set_key_focus(portalEntry);
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
                        'To see available gateways:\n\n' +
                        '1. Connect to VPN first\n' +
                        '2. Open this menu again to see all gateways\n' +
                        '3. Click on a gateway to switch to it'
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
                    gatewayItem.connect('activate', () => this._setGateway(gateway.name));
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
     * @param {string} gateway - Gateway address
     * @private
     */
    async _setGateway(gateway) {
        try {
            const currentStatus = this._statusMonitor.getCurrentStatus();
            
            // Show notification that we're switching
            this._showNotification('Switching Gateway', `Switching to ${gateway}...`);
            
            // If connected, disconnect first
            if (currentStatus && currentStatus.connected) {
                await this._gpClient.disconnect();
                // Wait a bit for disconnect to complete
                await this._delay(GATEWAY_SWITCH_DISCONNECT_WAIT_MS);
            }
            
            // Connect directly to the selected gateway using --gateway flag
            // This ensures we connect to the SELECTED gateway, not the first one
            await this._gpClient.connectToGateway(gateway);
            
            // Invalidate caches to refresh on next open
            this._gatewayListCache = null;
            this._connectionDetailsCache = null;
            
            // Force status update by polling immediately
            this._statusMonitor._poll();
            
            this._showNotification('Gateway Changed', `Successfully switched to: ${gateway}`);
        } catch (e) {
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
                    this._showNotification('Log Collection', `Logs collected successfully.\n\nFolder opened: ~/.GlobalProtect/`);
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
     * Open comprehensive settings dialog with all options
     * @private
     */
    _openSettingsDialog() {
        try {
            const currentPortal = this._settings.get_string('portal-address');
            const currentInterval = this._settings.get_int('poll-interval');
            const currentUsername = this._settings.get_string('username');
            
            // Create modal dialog
            const dialog = new ModalDialog.ModalDialog();
            
            // Add title
            const titleLabel = new St.Label({
                text: 'Settings',
                style_class: 'headline',
                x_align: Clutter.ActorAlign.CENTER
            });
            dialog.contentLayout.add_child(titleLabel);
            
            // Add content box
            const contentBox = new St.BoxLayout({
                vertical: true,
                style: 'padding: 20px; spacing: 15px; min-width: 500px;'
            });
            
            // Portal section
            const portalLabel = new St.Label({
                text: 'Portal Address:',
                style: 'font-size: 11pt; color: #ffffff;'
            });
            contentBox.add_child(portalLabel);
            
            const portalEntry = new St.Entry({
                text: currentPortal,
                hint_text: 'vpn.example.com',
                style: 'font-size: 11pt; padding: 8px; min-width: 400px;',
                can_focus: true
            });
            contentBox.add_child(portalEntry);
            
            // Poll interval section
            const intervalLabel = new St.Label({
                text: 'Poll Interval (seconds):',
                style: 'font-size: 11pt; color: #ffffff; margin-top: 15px;'
            });
            contentBox.add_child(intervalLabel);
            
            const intervalEntry = new St.Entry({
                text: currentInterval.toString(),
                hint_text: '5',
                style: 'font-size: 11pt; padding: 8px; min-width: 100px;',
                can_focus: true
            });
            contentBox.add_child(intervalEntry);
            
            // Info label
            const infoLabel = new St.Label({
                text: 'Poll interval: how often to check VPN status (recommended: 5-10 seconds)',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 10px;'
            });
            infoLabel.clutter_text.line_wrap = true;
            infoLabel.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            contentBox.add_child(infoLabel);
            
            // Username section
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
            usernameInfo.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            contentBox.add_child(usernameInfo);
            
            // Separator
            const separator = new St.Widget({
                style: 'height: 1px; background-color: #555; margin-top: 20px; margin-bottom: 20px;'
            });
            contentBox.add_child(separator);
            
            // Clear Credentials section
            const clearCredsLabel = new St.Label({
                text: 'Clear Credentials:',
                style: 'font-size: 11pt; color: #ffffff;'
            });
            contentBox.add_child(clearCredsLabel);
            
            const clearCredsButton = new St.Button({
                label: 'Clear Saved Credentials',
                style: 'font-size: 11pt; padding: 8px 16px; background-color: #c01c28; color: #ffffff; border-radius: 6px;',
                can_focus: true
            });
            clearCredsButton.connect('clicked', () => {
                dialog.close();
                this._clearCredentials();
            });
            contentBox.add_child(clearCredsButton);
            
            const clearCredsInfo = new St.Label({
                text: 'Remove saved username and password from GlobalProtect',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 5px;'
            });
            clearCredsInfo.clutter_text.line_wrap = true;
            clearCredsInfo.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
            contentBox.add_child(clearCredsInfo);
            
            // Another separator
            const separator2 = new St.Widget({
                style: 'height: 1px; background-color: #555; margin-top: 20px; margin-bottom: 20px;'
            });
            contentBox.add_child(separator2);
            
            // Advanced Settings section
            const advancedLabel = new St.Label({
                text: 'Advanced Settings:',
                style: 'font-size: 11pt; color: #ffffff; font-weight: bold;'
            });
            contentBox.add_child(advancedLabel);
            
            // SSL Only checkbox
            const currentSslOnly = this._settings.get_boolean('ssl-only');
            const sslOnlyBox = new St.BoxLayout({
                style: 'margin-top: 10px;'
            });
            
            const sslOnlyCheckbox = new St.Button({
                style: 'width: 20px; height: 20px; border: 2px solid #ffffff; border-radius: 4px; background-color: ' + (currentSslOnly ? '#3584e4' : 'transparent') + ';',
                can_focus: true
            });
            
            let sslOnlyChecked = currentSslOnly;
            sslOnlyCheckbox.connect('clicked', () => {
                sslOnlyChecked = !sslOnlyChecked;
                sslOnlyCheckbox.style = 'width: 20px; height: 20px; border: 2px solid #ffffff; border-radius: 4px; background-color: ' + (sslOnlyChecked ? '#3584e4' : 'transparent') + ';';
            });
            
            sslOnlyBox.add_child(sslOnlyCheckbox);
            
            const sslOnlyLabel = new St.Label({
                text: '  SSL Only Mode',
                style: 'font-size: 11pt; color: #ffffff; margin-left: 10px;'
            });
            sslOnlyBox.add_child(sslOnlyLabel);
            contentBox.add_child(sslOnlyBox);
            
            const sslOnlyInfo = new St.Label({
                text: 'Force SSL-only connections (more secure)',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 5px; margin-left: 30px;'
            });
            contentBox.add_child(sslOnlyInfo);
            
            // Log Level dropdown
            const logLevelLabel = new St.Label({
                text: 'Log Level:',
                style: 'font-size: 11pt; color: #ffffff; margin-top: 15px;'
            });
            contentBox.add_child(logLevelLabel);
            
            const currentLogLevel = this._settings.get_string('log-level');
            const logLevels = ['error', 'warning', 'info', 'debug'];
            
            const logLevelBox = new St.BoxLayout({
                style: 'margin-top: 5px; spacing: 10px;'
            });
            
            let selectedLogLevel = currentLogLevel;
            const logLevelButtons = [];
            
            for (const level of logLevels) {
                const isSelected = level === currentLogLevel;
                const button = new St.Button({
                    label: level.charAt(0).toUpperCase() + level.slice(1),
                    style: 'font-size: 10pt; padding: 6px 12px; border-radius: 4px; ' + 
                           (isSelected ? 'background-color: #3584e4; color: #ffffff;' : 'background-color: #3a3a3a; color: #cccccc;'),
                    can_focus: true
                });
                
                button.connect('clicked', () => {
                    selectedLogLevel = level;
                    // Update all buttons
                    logLevelButtons.forEach((btn, idx) => {
                        const lvl = logLevels[idx];
                        const selected = lvl === selectedLogLevel;
                        btn.style = 'font-size: 10pt; padding: 6px 12px; border-radius: 4px; ' + 
                                   (selected ? 'background-color: #3584e4; color: #ffffff;' : 'background-color: #3a3a3a; color: #cccccc;');
                    });
                });
                
                logLevelButtons.push(button);
                logLevelBox.add_child(button);
            }
            
            contentBox.add_child(logLevelBox);
            
            const logLevelInfo = new St.Label({
                text: 'Higher levels provide more detailed logs (debug = most verbose)',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 5px;'
            });
            contentBox.add_child(logLevelInfo);
            
            // Import Certificate button
            const importCertLabel = new St.Label({
                text: 'Client Certificate:',
                style: 'font-size: 11pt; color: #ffffff; margin-top: 15px;'
            });
            contentBox.add_child(importCertLabel);
            
            const importCertButton = new St.Button({
                label: 'Import Certificate...',
                style: 'font-size: 11pt; padding: 8px 16px; background-color: #3a3a3a; color: #ffffff; border-radius: 6px;',
                can_focus: true
            });
            importCertButton.connect('clicked', () => {
                dialog.close();
                this._importCertificate();
            });
            contentBox.add_child(importCertButton);
            
            const importCertInfo = new St.Label({
                text: 'Import client certificate for authentication',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 5px;'
            });
            contentBox.add_child(importCertInfo);
            
            dialog.contentLayout.add_child(contentBox);
            
            // Add Save button
            dialog.addButton({
                label: 'Save',
                action: () => {
                    const newPortal = portalEntry.get_text();
                    const newIntervalText = intervalEntry.get_text();
                    const newInterval = parseInt(newIntervalText);
                    const newUsername = usernameEntry.get_text();
                    
                    let changed = false;
                    let message = 'Settings saved:\n';
                    
                    if (newPortal && newPortal !== currentPortal) {
                        this._settings.set_string('portal-address', newPortal);
                        message += `\nPortal: ${newPortal}`;
                        changed = true;
                    }
                    
                    if (!isNaN(newInterval) && newInterval > 0 && newInterval !== currentInterval) {
                        this._settings.set_int('poll-interval', newInterval);
                        message += `\nPoll interval: ${newInterval}s`;
                        changed = true;
                        
                        // Restart status monitor with new interval
                        if (this._statusMonitor) {
                            this._statusMonitor.stop();
                            this._statusMonitor._pollInterval = newInterval * 1000;
                            this._statusMonitor.start();
                        }
                    }
                    
                    if (newUsername !== currentUsername) {
                        this._settings.set_string('username', newUsername);
                        message += `\nUsername: ${newUsername || '(not set)'}`;
                        changed = true;
                    }
                    
                    // Save SSL Only setting
                    if (sslOnlyChecked !== currentSslOnly) {
                        this._settings.set_boolean('ssl-only', sslOnlyChecked);
                        message += `\nSSL Only: ${sslOnlyChecked ? 'enabled' : 'disabled'}`;
                        changed = true;
                        
                        // Apply SSL only setting
                        this._gpClient.setConfig(sslOnlyChecked).catch(e => {
                            ErrorHandler.handle(e, 'Failed to apply SSL only setting', {notify: true, log: true});
                        });
                    }
                    
                    // Save Log Level setting
                    if (selectedLogLevel !== currentLogLevel) {
                        this._settings.set_string('log-level', selectedLogLevel);
                        message += `\nLog Level: ${selectedLogLevel}`;
                        changed = true;
                        
                        // Apply log level setting
                        this._gpClient.setLogLevel(selectedLogLevel).catch(e => {
                            ErrorHandler.handle(e, 'Failed to apply log level', {notify: true, log: true});
                        });
                    }
                    
                    if (changed) {
                        this._showNotification('Settings', message);
                    }
                    
                    dialog.close();
                },
                key: Clutter.KEY_Return
            });
            
            // Add Cancel button
            dialog.addButton({
                label: 'Cancel',
                action: () => {
                    dialog.close();
                },
                key: Clutter.KEY_Escape
            });
            
            // Open dialog and focus first input
            dialog.open();
            global.stage.set_key_focus(portalEntry);
            
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to show settings dialog', {notify: true, log: true});
        }
    }



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
            const version = await this._gpClient.getVersion();
            const content = `${version}\n\n` +
                `gp-gnome - GNOME Shell Extension\n` +
                `Extension version: 1.3.1\n\n` +
                `Description:\n` +
                `GNOME Shell extension gp-gnome for GlobalProtect VPN CLI (PanGPLinux) integration.\n` +
                `Provides complete VPN management with native GNOME integration,\n` +
                `comprehensive functionality, and intelligent handling of known CLI issues.\n\n` +
                `Designed for GlobalProtect CLI (also known as PanGPLinux) -\n` +
                `the official Palo Alto Networks VPN client for Linux.\n\n` +
                `Features:\n` +
                `• Connect/disconnect with MFA support\n` +
                `• Real-time connection monitoring\n` +
                `• Gateway selection and switching\n` +
                `• Interactive settings configuration\n` +
                `• Advanced operations (HIP, logs, network rediscovery)\n` +
                `• Automatic retry logic for CLI bugs\n` +
                `• Auto-disconnect on logout\n` +
                `• Native GNOME Shell integration\n\n` +
                `Author: Anton Isaiev\n` +
                `Email: totoshko88@gmail.com\n` +
                `Repository: https://github.com/totoshko88/gp-gnome\n` +
                `License: GPL-3.0-or-later\n\n` +
                `© 2025 Anton Isaiev`;
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
     * Clear user credentials
     * @private
     */
    async _clearCredentials() {
        try {
            // Show confirmation
            this._showNotification(
                'Clear Credentials',
                'This will clear your saved credentials and disconnect from VPN.\n\n' +
                'To proceed, run in terminal:\n' +
                'globalprotect remove-user\n\n' +
                'Note: This command requires confirmation (y/n)'
            );
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to clear credentials', {notify: true, log: true});
        }
    }

    /**
     * Import client certificate with dialog
     * @private
     */
    async _importCertificate() {
        try {
            // Create modal dialog
            const dialog = new ModalDialog.ModalDialog();
            
            // Add title
            const titleLabel = new St.Label({
                text: 'Import Certificate',
                style_class: 'headline',
                x_align: Clutter.ActorAlign.CENTER
            });
            dialog.contentLayout.add_child(titleLabel);
            
            // Add content box
            const contentBox = new St.BoxLayout({
                vertical: true,
                style: 'padding: 20px; spacing: 15px; min-width: 500px;'
            });
            
            // Info label
            const infoLabel = new St.Label({
                text: 'Enter the full path to your certificate file:',
                style: 'font-size: 11pt; color: #ffffff;'
            });
            contentBox.add_child(infoLabel);
            
            // Certificate path entry
            const certPathEntry = new St.Entry({
                hint_text: '/path/to/certificate.pem',
                style: 'font-size: 11pt; padding: 8px; min-width: 450px;',
                can_focus: true
            });
            contentBox.add_child(certPathEntry);
            
            // Example label
            const exampleLabel = new St.Label({
                text: 'Example: /home/user/certificates/client.pem',
                style: 'font-size: 10pt; color: #aaaaaa; margin-top: 5px;'
            });
            contentBox.add_child(exampleLabel);
            
            // Validation info
            const validationLabel = new St.Label({
                text: '',
                style: 'font-size: 10pt; margin-top: 10px;'
            });
            contentBox.add_child(validationLabel);
            
            dialog.contentLayout.add_child(contentBox);
            
            // Add Import button
            dialog.addButton({
                label: 'Import',
                action: async () => {
                    const certPath = certPathEntry.get_text().trim();
                    
                    if (!certPath) {
                        validationLabel.text = '⚠ Please enter a certificate path';
                        validationLabel.style = 'font-size: 10pt; color: #f66151; margin-top: 10px;';
                        return;
                    }
                    
                    // Validate file exists
                    const file = Gio.File.new_for_path(certPath);
                    if (!file.query_exists(null)) {
                        validationLabel.text = '❌ File not found: ' + certPath;
                        validationLabel.style = 'font-size: 10pt; color: #f66151; margin-top: 10px;';
                        return;
                    }
                    
                    // Check file extension
                    if (!certPath.endsWith('.pem') && !certPath.endsWith('.crt') && !certPath.endsWith('.cer')) {
                        validationLabel.text = '⚠ Warning: File should be .pem, .crt, or .cer';
                        validationLabel.style = 'font-size: 10pt; color: #f9f06b; margin-top: 10px;';
                        // Continue anyway
                    }
                    
                    dialog.close();
                    
                    // Show importing notification
                    this._showNotification('Import Certificate', 'Importing certificate...');
                    
                    // Import certificate
                    try {
                        const result = await this._gpClient.importCertificate(certPath);
                        this._showNotification('Certificate Imported', result);
                    } catch (e) {
                        ErrorHandler.handle(e, 'Failed to import certificate', {
                            notify: true,
                            log: true
                        });
                    }
                },
                key: Clutter.KEY_Return
            });
            
            // Add Cancel button
            dialog.addButton({
                label: 'Cancel',
                action: () => {
                    dialog.close();
                },
                key: Clutter.KEY_Escape
            });
            
            // Open dialog and focus input
            dialog.open();
            global.stage.set_key_focus(certPathEntry);
            
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to show import dialog', {notify: true, log: true});
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
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
        this._signalIds.forEach(({ obj, id }) => {
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
