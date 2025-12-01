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
            // Load GSettings
            this._settings = this.getSettings();
            
            // Create GlobalProtectClient instance
            this._gpClient = new GlobalProtectClient(this._settings);
            
            // Create StatusMonitor instance
            this._statusMonitor = new StatusMonitor(this._gpClient, this._settings);
            
            // Create GlobalProtectIndicator instance
            this._indicator = new GlobalProtectIndicator(
                this._gpClient,
                this._statusMonitor,
                this._settings,
                this.path
            );
            
            // Add indicator to panel status area
            Main.panel.addToStatusArea(this.uuid, this._indicator);
            
            // Start status monitoring
            this._statusMonitor.start();
            
            // Connect to session manager for logout detection
            this._connectToSessionManager();
        } catch (error) {
            console.error('gp-gnome: Failed to enable', error);
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
                if (!Main.sessionMode.isLocked && !Main.sessionMode.hasOverview) {
                    // Session is ending (logout) - disconnect VPN
                    this._disconnectOnLogout();
                }
            });
        } catch (error) {
            console.error('gp-gnome: Failed to connect to session manager', error);
        }
    }

    /**
     * Disconnect VPN on logout
     * @private
     */
    async _disconnectOnLogout() {
        try {
            await this._gpClient.disconnect();
        } catch (error) {
            console.error('gp-gnome: Failed to disconnect on logout', error);
        }
    }

    /**
     * Disable the extension
     * Cleans up all resources and removes indicator from panel
     * Resources are cleaned up in reverse order of creation
     */
    disable() {
        // 1. Stop monitoring first (prevents new operations)
        if (this._statusMonitor) {
            this._statusMonitor.stop();
            this._statusMonitor = null;
        }
        
        // 2. Destroy UI (might trigger operations)
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        
        // 3. Cancel ongoing operations
        if (this._gpClient) {
            this._gpClient.destroy();
            this._gpClient = null;
        }
        
        // 4. Disconnect signals (no more events)
        if (this._sessionModeChangedId) {
            try {
                Main.sessionMode.disconnect(this._sessionModeChangedId);
            } catch (e) {
                console.error('Failed to disconnect session signal:', e);
            }
            this._sessionModeChangedId = null;
        }
        
        // 5. Clear settings last
        this._settings = null;
    }
}
