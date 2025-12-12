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

import GLib from 'gi://GLib';
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
    }

    /**
     * Disable the extension
     * Cleans up all resources and removes indicator from panel
     * Resources are cleaned up in reverse order of creation
     */
    disable() {
        // 1. Stop monitoring (prevents new operations)
        if (this._statusMonitor) {
            this._statusMonitor.stop();
            this._statusMonitor = null;
        }
        
        // 2. Cancel ongoing operations in gpClient BEFORE destroying indicator
        if (this._gpClient) {
            this._gpClient.destroy();
            this._gpClient = null;
        }
        
        // 3. Destroy UI last (after all async operations are cancelled)
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        
        // 4. Clear settings
        this._settings = null;
        
        // 5. Auto-disconnect on logout - spawn async at the end
        GLib.spawn_command_line_async('globalprotect disconnect');
    }
}
