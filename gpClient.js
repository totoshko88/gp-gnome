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

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Constants for timeouts and delays
const COMMAND_TIMEOUT_DEFAULT = 10;
const COMMAND_TIMEOUT_MFA = 30;
const COMMAND_TIMEOUT_LOG_COLLECTION = 60;
const RETRY_DELAY_MS = 1000;
const MAX_RETRY_COUNT = 2;

/**
 * GlobalProtect CLI client wrapper
 * Provides async methods for interacting with GlobalProtect CLI
 */
export class GlobalProtectClient {
    constructor(settings) {
        this._settings = settings;
        this._commandPath = 'globalprotect';
        this._cancellable = new Gio.Cancellable();
        this._timeoutIds = new Set();
        this._cancelledSignalId = null;
    }

    /**
     * Check if GlobalProtect CLI is available
     * @returns {boolean} True if command is available
     */
    isCommandAvailable() {
        const result = GLib.find_program_in_path(this._commandPath);
        return result !== null;
    }

    /**
     * Execute a GlobalProtect command with timeout and cancellable
     * @param {string[]} args - Command arguments
     * @param {number} timeoutSeconds - Timeout in seconds
     * @returns {Promise<{stdout: string, stderr: string, success: boolean}>}
     * @private
     */
    async _executeCommand(args, timeoutSeconds = COMMAND_TIMEOUT_DEFAULT) {
        if (!this.isCommandAvailable()) {
            throw new Error('GlobalProtect CLI is not installed or not in PATH');
        }

        // Check if already cancelled or destroyed before starting
        if (!this._cancellable || this._cancellable.is_cancelled()) {
            throw new Error('Operation cancelled before execution');
        }

        return new Promise((resolve, reject) => {
            let timeoutId = null;
            let cancelledId = null;
            let completed = false;

            const cleanup = () => {
                if (completed) return;
                completed = true;

                if (timeoutId && this._timeoutIds.has(timeoutId)) {
                    GLib.source_remove(timeoutId);
                    this._timeoutIds.delete(timeoutId);
                }

                if (cancelledId) {
                    this._cancellable.disconnect(cancelledId);
                }
            };

            // Set up cancellation handler
            cancelledId = this._cancellable.connect(() => {
                cleanup();
                proc.force_exit();
                reject(new Error('Operation cancelled'));
            });

            const proc = Gio.Subprocess.new(
                [this._commandPath, ...args],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            // Set up timeout
            timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, timeoutSeconds, () => {
                cleanup();
                proc.force_exit();
                reject(new Error(`Command timed out after ${timeoutSeconds} seconds`));
                return GLib.SOURCE_REMOVE;
            });
            this._timeoutIds.add(timeoutId);

            // Execute command
            proc.communicate_utf8_async(null, this._cancellable, (proc, result) => {
                cleanup();

                if (this._cancellable.is_cancelled()) {
                    reject(new Error('Operation cancelled'));
                    return;
                }

                try {
                    const [, stdout, stderr] = proc.communicate_utf8_finish(result);
                    resolve({
                        stdout: stdout || '',
                        stderr: stderr || '',
                        success: proc.get_successful()
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * Delay helper using GLib.timeout_add with cancellation support
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     * @private
     */
    async _delay(ms) {
        if (this._cancellable.is_cancelled()) {
            throw new Error('Operation cancelled');
        }

        return new Promise((resolve, reject) => {
            const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
                this._timeoutIds.delete(timeoutId);
                resolve();
                return GLib.SOURCE_REMOVE;
            });
            this._timeoutIds.add(timeoutId);

            // Support cancellation during delay
            const cancelledId = this._cancellable.connect(() => {
                if (this._timeoutIds.has(timeoutId)) {
                    GLib.source_remove(timeoutId);
                    this._timeoutIds.delete(timeoutId);
                }
                this._cancellable.disconnect(cancelledId);
                reject(new Error('Operation cancelled'));
            });
        });
    }

    /**
     * Connect to GlobalProtect VPN with retry logic
     * @param {string} portal - Portal address
     * @param {Function} statusCallback - Optional callback for MFA status updates
     * @param {number} retryCount - Internal retry counter
     * @param {string} username - Optional username for connection
     * @returns {Promise<{success: boolean, message: string, mfaRequired: boolean, mfaFailed: boolean}>}
     */
    async connect(portal, statusCallback = null, retryCount = 0, username = null) {
        // Input validation
        if (!portal || typeof portal !== 'string' || portal.trim().length === 0) {
            throw new TypeError('Portal address must be a non-empty string');
        }

        if (statusCallback && typeof statusCallback !== 'function') {
            throw new TypeError('Status callback must be a function');
        }

        if (statusCallback) {
            const message = retryCount > 0 
                ? `Retrying connection (attempt ${retryCount + 1})...` 
                : 'Initiating connection...';
            statusCallback('connecting', message);
        }

        const args = ['connect', '--portal', portal];
        if (username) {
            args.push('--username', username);
        }

        const result = await this._executeCommand(args, COMMAND_TIMEOUT_MFA);
        const output = result.stdout + result.stderr;

        // Handle "already established" CLI bug
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.connect(portal, statusCallback, retryCount + 1, username);
            }
            
            const status = await this.getStatus();
            if (status.connected) {
                return {success: true, message: 'Already connected', mfaRequired: false, mfaFailed: false};
            }
        }

        const mfaFailed = this._detectMfaFailure(result.stdout, result.stderr);
        if (mfaFailed) {
            if (statusCallback) {
                statusCallback('mfa-failed', 'Authentication failed or timed out');
            }
            throw new Error('MFA authentication failed or timed out');
        }

        const mfaRequired = this._detectMfaInProgress(result.stdout, result.stderr);
        if (mfaRequired) {
            if (statusCallback) {
                statusCallback('mfa-waiting', 'Waiting for authentication...');
            }
            return {success: true, message: 'Waiting for MFA authentication', mfaRequired: true, mfaFailed: false};
        }

        if (!result.success) {
            throw new Error(result.stderr || 'Connection failed');
        }

        const connectionSuccess = this._detectConnectionSuccess(result.stdout);
        if (statusCallback) {
            statusCallback('connected', 'Connection established');
        }

        return {success: connectionSuccess, message: result.stdout, mfaRequired: false, mfaFailed: false};
    }

    _detectMfaInProgress(stdout, stderr) {
        const output = (stdout + stderr).toLowerCase();
        const patterns = ['waiting for authentication', 'authenticate', 'browser', 'saml', 'multi-factor', 'mfa'];
        return patterns.some(pattern => output.includes(pattern));
    }

    _detectMfaFailure(stdout, stderr) {
        const output = (stdout + stderr).toLowerCase();
        const patterns = ['authentication failed', 'authentication timeout', 'authentication cancelled'];
        return patterns.some(pattern => output.includes(pattern));
    }

    _detectConnectionSuccess(stdout) {
        const output = stdout.toLowerCase();
        return ['connected', 'connection established', 'successfully connected'].some(pattern => output.includes(pattern));
    }

    /**
     * Disconnect from GlobalProtect VPN
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>}
     */
    async disconnect(retryCount = 0) {
        const result = await this._executeCommand(['disconnect'], COMMAND_TIMEOUT_DEFAULT);
        const output = result.stdout + result.stderr;
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.disconnect(retryCount + 1);
            }
        }
        
        const lowerOutput = output.toLowerCase();
        if (lowerOutput.includes('disconnect') || lowerOutput.includes('success') || result.success) {
            return result.stdout || result.stderr || 'Disconnected';
        }

        throw new Error(result.stderr || 'Disconnection failed');
    }

    /**
     * Get current VPN status
     * @returns {Promise<Object>}
     */
    async getStatus() {
        try {
            const result = await this._executeCommand(['show', '--status'], 5);
            const status = {connected: false, portal: null, gateway: null};

            if (result.success && result.stdout) {
                const lines = result.stdout.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.toLowerCase().includes('status:')) {
                        const statusValue = trimmed.split(':')[1]?.trim().toLowerCase();
                        status.connected = statusValue === 'connected';
                    }
                    if (trimmed.toLowerCase().includes('portal:')) {
                        status.portal = trimmed.split(':')[1]?.trim() || null;
                    }
                    if (trimmed.toLowerCase().includes('gateway:')) {
                        status.gateway = trimmed.split(':')[1]?.trim() || null;
                    }
                }
            }
            return status;
        } catch (e) {
            console.error('Failed to get VPN status:', e.message);
            return {connected: false, portal: null, gateway: null};
        }
    }

    /**
     * Get detailed VPN connection information
     * @returns {Promise<Object>}
     */
    async getDetails() {
        const result = await this._executeCommand(['show', '--details'], 5);
        const output = result.stdout + result.stderr;
        
        if (!output || output.trim().length === 0) {
            throw new Error('No details available');
        }

        const details = {connected: false, portal: null, gateway: null, username: null, gatewayIp: null, assignedIp: null};
        
        if (result.stdout) {
            const lines = result.stdout.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                const lowerLine = trimmed.toLowerCase();
                
                if (lowerLine.includes('status:')) {
                    details.connected = trimmed.split(':')[1]?.trim().toLowerCase() === 'connected';
                }
                if (lowerLine.includes('portal:')) {
                    details.portal = trimmed.split(':')[1]?.trim() || null;
                }
                // Match "Gateway Name:" or "Gateway:"
                if (lowerLine.includes('gateway name:')) {
                    details.gateway = trimmed.split(':')[1]?.trim() || null;
                } else if (lowerLine.includes('gateway:') && !lowerLine.includes('gateway ip') && !lowerLine.includes('gateway description')) {
                    details.gateway = trimmed.split(':')[1]?.trim() || null;
                }
                if (lowerLine.includes('user:') || lowerLine.includes('username:')) {
                    details.username = trimmed.split(':')[1]?.trim() || null;
                }
                // Match "Gateway IP Address:" or "Gateway IP:"
                if (lowerLine.includes('gateway ip address:') || lowerLine.includes('gateway ip:')) {
                    details.gatewayIp = trimmed.split(':')[1]?.trim() || null;
                }
                // Match "Assigned IP Address:", "VPN IP:", or "Virtual IP:"
                if (lowerLine.includes('assigned ip address:') || lowerLine.includes('assigned ip:')) {
                    details.assignedIp = trimmed.split(':')[1]?.trim() || null;
                } else if (lowerLine.includes('vpn ip:') || lowerLine.includes('virtual ip:')) {
                    details.assignedIp = trimmed.split(':')[1]?.trim() || null;
                }
            }
        }
        return details;
    }

    async rediscoverNetwork() {
        const result = await this._executeCommand(['rediscover-network'], COMMAND_TIMEOUT_DEFAULT);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.toLowerCase().includes('successful') || output.toLowerCase().includes('success') || output.toLowerCase().includes('complete')) {
            return result.stdout || result.stderr || 'Network rediscovery completed';
        }
        
        if (!result.success) {
            throw new Error(result.stderr || 'Network rediscovery failed');
        }
        
        return result.stdout || 'Network rediscovery completed';
    }

    async resubmitHip(retryCount = 0) {
        const result = await this._executeCommand(['resubmit-hip'], COMMAND_TIMEOUT_DEFAULT);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.resubmitHip(retryCount + 1);
            }
        }

        if (output.toLowerCase().includes('successful') || output.toLowerCase().includes('success') || 
            output.toLowerCase().includes('submitted') || output.toLowerCase().includes('complete')) {
            return result.stdout || result.stderr || 'HIP resubmission completed';
        }

        if (output.trim()) {
            return output;
        }

        if (result.stderr && result.stderr.toLowerCase().includes('error')) {
            throw new Error(result.stderr);
        }

        return result.stdout || result.stderr || 'HIP resubmission completed';
    }

    async collectLog() {
        const result = await this._executeCommand(['collect-log'], COMMAND_TIMEOUT_LOG_COLLECTION);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.toLowerCase().includes('complete') || output.toLowerCase().includes('collection complete') ||
            output.includes('.tgz') || output.includes('saved to') || output.includes('support file')) {
            const match = output.match(/saved to (.+\.tgz)/i);
            if (match) {
                return `Logs collected successfully.\nFile: ${match[1]}`;
            }
            return output || 'Log collection completed';
        }

        throw new Error(result.stderr || output || 'Log collection failed');
    }

    async getGateways() {
        try {
            const manualResult = await this._executeCommand(['show', '--manual-gateway'], 5);
            const detailsResult = await this._executeCommand(['show', '--details'], 5);
            
            const gateways = [];
            const lines = (manualResult.stdout + manualResult.stderr).split('\n');
            
            let currentGatewayName = null;
            const detailsLines = (detailsResult.stdout + detailsResult.stderr).split('\n');
            for (const line of detailsLines) {
                const trimmed = line.trim();
                if (trimmed.toLowerCase().startsWith('gateway name:')) {
                    const parts = trimmed.split(':');
                    if (parts.length >= 2) {
                        currentGatewayName = parts.slice(1).join(':').trim();
                    }
                    break;
                }
            }
            
            let inGatewayList = false;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '' || trimmed.startsWith('Name')) continue;
                
                if (trimmed.startsWith('---')) {
                    inGatewayList = true;
                    continue;
                }
                
                if (inGatewayList) {
                    const parts = trimmed.split(/\s+/);
                    if (parts.length >= 1) {
                        const name = parts[0];
                        const address = parts.length >= 2 ? parts[1] : name;
                        const preferred = parts.length >= 3 && parts[2].toLowerCase() === 'yes';
                        
                        gateways.push({
                            name: name,
                            address: address,
                            preferred: preferred,
                            current: currentGatewayName === name
                        });
                    }
                }
            }
            
            return gateways;
        } catch (e) {
            console.error('Failed to get gateways:', e.message);
            return [];
        }
    }

    async setPreferredGateway(gateway) {
        if (!gateway || typeof gateway !== 'string' || gateway.trim().length === 0) {
            throw new TypeError('Gateway must be a non-empty string');
        }

        const result = await this._executeCommand(['set-preferred-gateway', gateway], COMMAND_TIMEOUT_DEFAULT);
        const output = result.stdout + result.stderr;
        
        if (output.toLowerCase().includes('success') || output.toLowerCase().includes('set')) {
            return `Preferred gateway set to ${gateway}`;
        }
        
        if (!result.success) {
            throw new Error(result.stderr || 'Failed to set preferred gateway');
        }
        
        return result.stdout || `Preferred gateway set to ${gateway}`;
    }

    async connectToGateway(gateway, statusCallback = null, retryCount = 0) {
        if (!gateway || typeof gateway !== 'string' || gateway.trim().length === 0) {
            throw new TypeError('Gateway address must be a non-empty string');
        }

        if (statusCallback) {
            const message = retryCount > 0 
                ? `Retrying gateway connection (attempt ${retryCount + 1})...` 
                : 'Connecting to gateway...';
            statusCallback('connecting', message);
        }

        const result = await this._executeCommand(['connect', '--gateway', gateway], COMMAND_TIMEOUT_MFA);
        const output = result.stdout + result.stderr;
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.connectToGateway(gateway, statusCallback, retryCount + 1);
            }
            
            const status = await this.getStatus();
            if (status.connected) {
                return {success: true, message: 'Already connected'};
            }
        }
        
        const success = output.toLowerCase().includes('connected') || result.success;

        if (statusCallback) {
            statusCallback(success ? 'connected' : 'failed', success ? 'Connected to gateway' : 'Connection failed');
        }

        return {success: success, message: result.stdout || result.stderr || 'Connected to gateway'};
    }

    async getVersion(retryCount = 0) {
        const result = await this._executeCommand(['show', '--version'], 5);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.getVersion(retryCount + 1);
            }
        }
        
        return result.stdout || result.stderr || 'Version unknown';
    }
    
    /**
     * Check if output contains permission/ownership error
     * @param {string} output - Command output
     * @returns {boolean}
     * @private
     */
    _isPermissionError(output) {
        const lowerOutput = output.toLowerCase();
        return lowerOutput.includes('another user') ||
               lowerOutput.includes('different user') ||
               lowerOutput.includes('owned by') ||
               lowerOutput.includes('permission denied') ||
               lowerOutput.includes('same user or another user');
    }

    async getErrors(retryCount = 0) {
        const result = await this._executeCommand(['show', '--error'], 5);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.getErrors(retryCount + 1);
            }
        }
        
        return result.stdout || result.stderr || 'No errors';
    }

    async getHostState(retryCount = 0) {
        const result = await this._executeCommand(['show', '--host-state'], 5);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.getHostState(retryCount + 1);
            }
        }
        
        // Check if output is empty or only whitespace
        const trimmedOutput = (result.stdout || '').trim();
        if (trimmedOutput.length === 0) {
            return 'No host state information available.\n\nThis may happen when:\n• VPN is not connected\n• GlobalProtect service is not running\n• Host state data is not available';
        }
        
        return trimmedOutput;
    }

    async getNotifications(retryCount = 0) {
        const result = await this._executeCommand(['show', '--notifications'], 5);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.getNotifications(retryCount + 1);
            }
        }
        
        return result.stdout || result.stderr || 'No notifications';
    }

    async getHelp(retryCount = 0) {
        const result = await this._executeCommand(['show', '--help'], 5);
        const output = result.stdout + result.stderr;
        
        // Check for permission/ownership errors - only if command failed
        if (!result.success && this._isPermissionError(output)) {
            throw new Error('GlobalProtect is running under a different user account. Please run the command as the correct user or restart GlobalProtect.');
        }
        
        if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
            if (retryCount < MAX_RETRY_COUNT) {
                await this._delay(RETRY_DELAY_MS);
                return this.getHelp(retryCount + 1);
            }
        }
        
        return result.stdout || result.stderr || 'No help available';
    }

    extractLogFilePath(output) {
        const match = output.match(/saved to (.+\.tgz)/i);
        return match ? match[1] : null;
    }

    /**
     * Cleanup method - cancel all operations and remove timeouts
     */
    destroy() {
        // Cancel all subprocess operations
        if (this._cancellable && !this._cancellable.is_cancelled()) {
            this._cancellable.cancel();
        }
        
        // Remove all timeouts
        for (const timeoutId of this._timeoutIds) {
            try {
                GLib.source_remove(timeoutId);
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
        this._timeoutIds.clear();
        
        // Don't create new cancellable - object is being destroyed
        this._cancellable = null;
    }
}
