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

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {GlobalProtectClient} from './gpClient.js';
import {StatusMonitor} from './statusMonitor.js';
import {GlobalProtectIndicator} from './indicator.js';

/**
 * gp-gnome Extension
 * Main extension class that manages the lifecycle of the GlobalProtect VPN indicator
 * For GlobalProtect CLI (PanGPLinux) integration
 */
export default class GlobalProtectExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        
        // Initialize instance variables
        this._indicator = null;
        this._gpClient = null;
        this._statusMonitor = null;
        this._settings = null;
    }

    /**
     * Enable the extension
     * Creates all components and adds indicator to panel
     */
    enable() {
        try {
            log('gp-gnome: enable() called');
            
            // Load GSettings
            this._settings = this.getSettings();
            log('gp-gnome: settings loaded');
            
            // Create GlobalProtectClient instance
            this._gpClient = new GlobalProtectClient(this._settings);
            log('gp-gnome: client created');
            
            // Create StatusMonitor instance
            this._statusMonitor = new StatusMonitor(this._gpClient, this._settings);
            log('gp-gnome: status monitor created');
            
            // Create GlobalProtectIndicator instance
            this._indicator = new GlobalProtectIndicator(
                this._gpClient,
                this._statusMonitor,
                this._settings,
                this.path
            );
            log('gp-gnome: indicator created');
            
            // Add indicator to panel status area
            Main.panel.addToStatusArea(this.uuid, this._indicator);
            log('gp-gnome: indicator added to panel');
            
            // Start status monitoring
            this._statusMonitor.start();
            log('gp-gnome: status monitoring started');
            
            // Connect to session manager for logout detection
            this._connectToSessionManager();
        } catch (error) {
            logError(error, 'gp-gnome: Failed to enable');
        }
    }

    /**
     * Connect to session manager to detect logout
     * @private
     */
    _connectToSessionManager() {
        try {
            const SessionManager = Main.sessionMode;
            
            // Listen for session mode changes (logout, lock, etc.)
            this._sessionModeChangedId = Main.sessionMode.connect('updated', () => {
                // Check if session is ending (logout)
                if (Main.sessionMode.isLocked) {
                    // Session is locked - do NOT disconnect
                    log('gp-gnome: Session locked, keeping VPN connected');
                } else if (!Main.sessionMode.hasOverview) {
                    // Session is ending (logout) - disconnect VPN
                    log('gp-gnome: Session ending, disconnecting VPN');
                    this._disconnectOnLogout();
                }
            });
            
            log('gp-gnome: Connected to session manager');
        } catch (error) {
            logError(error, 'gp-gnome: Failed to connect to session manager');
        }
    }

    /**
     * Disconnect VPN on logout
     * @private
     */
    async _disconnectOnLogout() {
        try {
            log('gp-gnome: Disconnecting VPN on logout');
            await this._gpClient.disconnect();
            log('gp-gnome: VPN disconnected successfully');
        } catch (error) {
            logError(error, 'gp-gnome: Failed to disconnect on logout');
        }
    }

    /**
     * Disable the extension
     * Cleans up all resources and removes indicator from panel
     */
    disable() {
        // Disconnect session manager signal
        if (this._sessionModeChangedId) {
            Main.sessionMode.disconnect(this._sessionModeChangedId);
            this._sessionModeChangedId = null;
        }
        
        // Stop status monitor
        if (this._statusMonitor) {
            this._statusMonitor.stop();
            this._statusMonitor = null;
        }
        
        // Destroy indicator (this also removes it from panel)
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        
        // Clear all references
        this._gpClient = null;
        this._settings = null;
    }
}
