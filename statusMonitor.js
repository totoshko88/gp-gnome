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
import GLib from 'gi://GLib';
import {ErrorHandler} from './errorHandler.js';

/**
 * StatusMonitor - Monitors GlobalProtect VPN connection status
 * Polls the VPN status periodically and emits signals when status changes
 */
export const StatusMonitor = GObject.registerClass({
    Signals: {
        'status-changed': {
            param_types: [GObject.TYPE_JSOBJECT]
        }
    }
}, class StatusMonitor extends GObject.Object {
    _init(gpClient, settings) {
        super._init();
        
        this._gpClient = gpClient;
        this._settings = settings;
        this._timeoutId = null;
        this._currentStatus = null;
        this._pollInterval = 5000; // Default 5 seconds in milliseconds
        this._isStopped = false; // Flag to prevent polling after stop
        
        // Debounce counter for disconnect events
        // Prevents false disconnects when CLI temporarily reports wrong status
        this._disconnectDebounceCount = 0;
        this._disconnectDebounceThreshold = 2; // Require 2 consecutive disconnected polls
        
        // Read poll interval from settings if available
        if (this._settings) {
            this._pollInterval = this._settings.get_int('poll-interval') * 1000;
        }
    }

    /**
     * Start monitoring VPN status
     * Begins periodic polling of connection status
     */
    start() {
        // Don't start if already running
        if (this._timeoutId) {
            return;
        }
        
        // Do initial poll immediately
        this._poll();
        
        // Set up periodic polling
        this._timeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this._pollInterval,
            () => {
                this._poll();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    /**
     * Stop monitoring VPN status
     * Cleans up the polling timeout
     */
    stop() {
        this._isStopped = true;
        
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
    }

    /**
     * Force immediate status update (public method)
     * @returns {Promise<void>}
     */
    async forceUpdate() {
        await this._poll();
    }

    /**
     * Poll VPN status and emit signal if changed
     * @private
     */
    async _poll() {
        // Don't poll if stopped
        if (this._isStopped) {
            return;
        }
        
        try {
            const status = await this._gpClient.getStatus();
            
            // Check again after async operation
            if (this._isStopped) {
                return;
            }
            
            // Only emit signal if status actually changed
            if (this._hasStatusChanged(status)) {
                this._currentStatus = status;
                this.emit('status-changed', status);
            }
        } catch (e) {
            // Log error but don't stop polling
            ErrorHandler.handle(e, 'Failed to poll VPN status', {notify: false, log: true});
        }
    }

    /**
     * Check if status has changed with debounce for disconnect
     * @param {Object} newStatus - New status object
     * @returns {boolean} True if status changed
     * @private
     */
    _hasStatusChanged(newStatus) {
        // First poll - always consider it changed
        if (this._currentStatus === null) {
            return true;
        }
        
        const wasConnected = this._currentStatus && this._currentStatus.connected;
        const isConnected = newStatus && newStatus.connected;
        
        // If transitioning from connected to disconnected, apply debounce
        if (wasConnected && !isConnected) {
            this._disconnectDebounceCount++;
            
            // Only report disconnect after threshold consecutive polls
            if (this._disconnectDebounceCount < this._disconnectDebounceThreshold) {
                // Don't report change yet - might be temporary
                return false;
            }
            // Threshold reached - report the disconnect
            this._disconnectDebounceCount = 0;
            return true;
        }
        
        // Reset debounce counter if connected
        if (isConnected) {
            this._disconnectDebounceCount = 0;
        }
        
        // Compare status objects for other changes
        return JSON.stringify(newStatus) !== JSON.stringify(this._currentStatus);
    }

    /**
     * Get current cached status
     * @returns {Object|null} Current status or null if not yet polled
     */
    getCurrentStatus() {
        return this._currentStatus;
    }
});
