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
import {ErrorHandler} from './errorHandler.js';

/**
 * GlobalProtect CLI client wrapper
 * Provides async methods for interacting with GlobalProtect CLI
 */
export class GlobalProtectClient {
    constructor(settings) {
        this._settings = settings;
        this._commandPath = 'globalprotect';
    }

    /**
     * Check if GlobalProtect CLI is available
     * @returns {boolean} True if command is available
     */
    isCommandAvailable() {
        try {
            const result = GLib.find_program_in_path(this._commandPath);
            return result !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * Execute a GlobalProtect command with timeout
     * @param {string[]} args - Command arguments
     * @param {number} timeoutSeconds - Timeout in seconds
     * @returns {Promise<{stdout: string, stderr: string, success: boolean}>}
     */
    async _executeCommand(args, timeoutSeconds = 10) {
        // Check command availability first
        if (!this.isCommandAvailable()) {
            const error = new Error('GlobalProtect CLI is not installed or not in PATH');
            ErrorHandler.handle(error, 'Command availability check', {notify: false, log: true});
            throw error;
        }

        return new Promise((resolve, reject) => {
            try {
                const proc = Gio.Subprocess.new(
                    [this._commandPath, ...args],
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                );

                // Set up timeout
                const timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, timeoutSeconds, () => {
                    proc.force_exit();
                    const error = new Error(`Command timed out after ${timeoutSeconds} seconds`);
                    ErrorHandler.handle(error, 'Command execution timeout', {notify: false, log: true});
                    reject(error);
                    return GLib.SOURCE_REMOVE;
                });

                // Communicate with subprocess
                proc.communicate_utf8_async(null, null, (proc, result) => {
                    GLib.source_remove(timeoutId);

                    try {
                        const [, stdout, stderr] = proc.communicate_utf8_finish(result);
                        const success = proc.get_successful();

                        resolve({
                            stdout: stdout || '',
                            stderr: stderr || '',
                            success: success
                        });
                    } catch (e) {
                        ErrorHandler.handle(e, 'Subprocess communication error', {notify: false, log: true});
                        reject(e);
                    }
                });
            } catch (e) {
                ErrorHandler.handle(e, 'Subprocess creation error', {notify: false, log: true});
                reject(e);
            }
        });
    }

    /**
     * Connect to GlobalProtect VPN with retry logic
     * @param {string} portal - Portal address
     * @param {Function} statusCallback - Optional callback for MFA status updates
     * @param {number} retryCount - Internal retry counter
     * @param {string} username - Optional username for connection
     * @returns {Promise<{success: boolean, message: string, mfaRequired: boolean, mfaFailed: boolean}>} Connection result
     */
    async connect(portal, statusCallback = null, retryCount = 0, username = null) {
        try {
            if (!portal) {
                throw new Error('Portal address is required');
            }

            // Notify that connection is starting
            if (statusCallback) {
                statusCallback('connecting', retryCount > 0 ? `Retrying connection (attempt ${retryCount + 1})...` : 'Initiating connection...');
            }

            const args = ['connect', '--portal', portal];
            if (username) {
                args.push('--username', username);
            }

            const result = await this._executeCommand(
                args,
                30 // 30 seconds timeout for MFA
            );

            // Check for "already established" error - this is a known GlobalProtect CLI bug
            const output = result.stdout + result.stderr;
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                // If this is first attempt, retry once after a short delay
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected: "already established" error. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.connect(portal, statusCallback, retryCount + 1);
                }
                // If still failing after retries, it might be a real issue
                log('GlobalProtect CLI: Multiple "already established" errors. Checking current status...');
                // Check if we're actually connected
                const status = await this.getStatus();
                if (status.connected) {
                    log('GlobalProtect: Already connected, treating as success');
                    return {
                        success: true,
                        message: 'Already connected',
                        mfaRequired: false,
                        mfaFailed: false
                    };
                }
            }

            // Check for MFA failure first
            const mfaFailed = this._detectMfaFailure(result.stdout, result.stderr);
            
            if (mfaFailed) {
                if (statusCallback) {
                    statusCallback('mfa-failed', 'Authentication failed or timed out');
                }
                
                throw new Error('MFA authentication failed or timed out');
            }

            // Check for MFA in progress
            const mfaRequired = this._detectMfaInProgress(result.stdout, result.stderr);
            
            if (mfaRequired) {
                // MFA authentication is in progress
                if (statusCallback) {
                    statusCallback('mfa-waiting', 'Waiting for authentication...');
                }
                
                // The command is non-blocking - browser window will open separately
                // We return success but indicate MFA is in progress
                return {
                    success: true,
                    message: 'Waiting for MFA authentication',
                    mfaRequired: true,
                    mfaFailed: false
                };
            }

            if (!result.success) {
                throw new Error(result.stderr || 'Connection failed');
            }

            // Check if connection was successful
            const connectionSuccess = this._detectConnectionSuccess(result.stdout);
            
            if (statusCallback) {
                statusCallback('connected', 'Connection established');
            }

            return {
                success: connectionSuccess,
                message: result.stdout,
                mfaRequired: false,
                mfaFailed: false
            };
        } catch (e) {
            ErrorHandler.handle(e, 'VPN connection failed', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Detect if MFA authentication is in progress from CLI output
     * @param {string} stdout - Standard output
     * @param {string} stderr - Standard error
     * @returns {boolean} True if MFA is in progress
     * @private
     */
    _detectMfaInProgress(stdout, stderr) {
        const output = (stdout + stderr).toLowerCase();
        
        // Common patterns that indicate MFA is in progress
        const mfaPatterns = [
            'waiting for authentication',
            'authenticate',
            'browser',
            'saml',
            'multi-factor',
            'mfa',
            'verification',
            'please complete authentication',
            'open your browser',
            'authentication required'
        ];
        
        return mfaPatterns.some(pattern => output.includes(pattern));
    }

    /**
     * Detect if MFA authentication failed from CLI output
     * @param {string} stdout - Standard output
     * @param {string} stderr - Standard error
     * @returns {boolean} True if MFA failed
     * @private
     */
    _detectMfaFailure(stdout, stderr) {
        const output = (stdout + stderr).toLowerCase();
        
        // Patterns that indicate MFA failure
        const failurePatterns = [
            'authentication failed',
            'authentication timeout',
            'authentication cancelled',
            'authentication denied',
            'failed to authenticate',
            'timeout waiting for authentication',
            'user cancelled',
            'authentication error'
        ];
        
        return failurePatterns.some(pattern => output.includes(pattern));
    }

    /**
     * Detect if connection was successful from CLI output
     * @param {string} stdout - Standard output
     * @returns {boolean} True if connection succeeded
     * @private
     */
    _detectConnectionSuccess(stdout) {
        const output = stdout.toLowerCase();
        
        // Patterns that indicate successful connection
        const successPatterns = [
            'connected',
            'connection established',
            'successfully connected'
        ];
        
        return successPatterns.some(pattern => output.includes(pattern));
    }

    /**
     * Disconnect from GlobalProtect VPN with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Disconnection result message
     */
    async disconnect(retryCount = 0) {
        try {
            const result = await this._executeCommand(['disconnect'], 10);

            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in disconnect. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.disconnect(retryCount + 1);
                }
            }
            
            // Check output for success indicators instead of exit code
            const lowerOutput = output.toLowerCase();
            if (lowerOutput.includes('disconnect') || lowerOutput.includes('success') || result.success) {
                return result.stdout || result.stderr || 'Disconnected';
            }

            throw new Error(result.stderr || 'Disconnection failed');
        } catch (e) {
            ErrorHandler.handle(e, 'VPN disconnection failed', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get current VPN status
     * @returns {Promise<Object>} Status object with connected, portal, gateway fields
     */
    async getStatus() {
        try {
            const result = await this._executeCommand(['show', '--status'], 5);

            // Parse status output
            const status = {
                connected: false,
                portal: null,
                gateway: null
            };

            if (result.success && result.stdout) {
                const lines = result.stdout.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    
                    // Check connection status
                    if (trimmed.toLowerCase().includes('status:')) {
                        const statusValue = trimmed.split(':')[1]?.trim().toLowerCase();
                        status.connected = statusValue === 'connected';
                    }
                    
                    // Extract portal
                    if (trimmed.toLowerCase().includes('portal:')) {
                        status.portal = trimmed.split(':')[1]?.trim() || null;
                    }
                    
                    // Extract gateway
                    if (trimmed.toLowerCase().includes('gateway:')) {
                        status.gateway = trimmed.split(':')[1]?.trim() || null;
                    }
                }
            }

            return status;
        } catch (e) {
            // Log error but return disconnected status
            ErrorHandler.handle(e, 'Failed to get VPN status', {notify: false, log: true});
            return {
                connected: false,
                portal: null,
                gateway: null
            };
        }
    }

    /**
     * Get detailed VPN connection information
     * @returns {Promise<Object>} Detailed connection information
     */
    async getDetails() {
        try {
            const result = await this._executeCommand(['show', '--details'], 5);

            // Check if we have output (command may return non-zero but still have data)
            const output = result.stdout + result.stderr;
            if (!output || output.trim().length === 0) {
                throw new Error('No details available');
            }

            // Parse details output
            const details = {
                connected: false,
                portal: null,
                gateway: null,
                username: null,
                clientIp: null,
                vpnIp: null
            };

            if (result.stdout) {
                const lines = result.stdout.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    const lowerLine = trimmed.toLowerCase();
                    
                    if (lowerLine.includes('status:')) {
                        const statusValue = trimmed.split(':')[1]?.trim().toLowerCase();
                        details.connected = statusValue === 'connected';
                    }
                    
                    if (lowerLine.includes('portal:')) {
                        details.portal = trimmed.split(':')[1]?.trim() || null;
                    }
                    
                    if (lowerLine.includes('gateway:')) {
                        details.gateway = trimmed.split(':')[1]?.trim() || null;
                    }
                    
                    if (lowerLine.includes('user:') || lowerLine.includes('username:')) {
                        details.username = trimmed.split(':')[1]?.trim() || null;
                    }
                    
                    if (lowerLine.includes('client ip:')) {
                        details.clientIp = trimmed.split(':')[1]?.trim() || null;
                    }
                    
                    if (lowerLine.includes('vpn ip:') || lowerLine.includes('virtual ip:')) {
                        details.vpnIp = trimmed.split(':')[1]?.trim() || null;
                    }
                }
            }

            return details;
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get VPN details', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Rediscover network
     * @returns {Promise<string>} Command result
     */
    async rediscoverNetwork() {
        try {
            const result = await this._executeCommand(['rediscover-network'], 10);

            // Check for success message in output
            const output = result.stdout + result.stderr;
            if (output.toLowerCase().includes('successful') || output.toLowerCase().includes('success') || output.toLowerCase().includes('complete')) {
                return result.stdout || result.stderr || 'Network rediscovery completed';
            }

            if (!result.success) {
                throw new Error(result.stderr || 'Network rediscovery failed');
            }

            return result.stdout || 'Network rediscovery completed';
        } catch (e) {
            ErrorHandler.handle(e, 'Network rediscovery failed', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Resubmit HIP report with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Command result
     */
    async resubmitHip(retryCount = 0) {
        try {
            const result = await this._executeCommand(['resubmit-hip'], 10);

            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in resubmitHip. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.resubmitHip(retryCount + 1);
                }
            }

            // Check for success message in output (ignore exit code)
            if (output.toLowerCase().includes('successful') || 
                output.toLowerCase().includes('success') ||
                output.toLowerCase().includes('submitted') ||
                output.toLowerCase().includes('complete')) {
                return result.stdout || result.stderr || 'HIP resubmission completed';
            }

            // If no clear error, return output as is
            if (output.trim()) {
                return output;
            }

            // Only throw if we have a clear error message
            if (result.stderr && result.stderr.toLowerCase().includes('error')) {
                throw new Error(result.stderr);
            }

            return result.stdout || result.stderr || 'HIP resubmission completed';
        } catch (e) {
            ErrorHandler.handle(e, 'HIP resubmission failed', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Collect logs
     * @returns {Promise<string>} Command result
     */
    async collectLog() {
        try {
            const result = await this._executeCommand(['collect-log'], 60); // Extended timeout

            // Check for success message or log file path in output (ignore exit code)
            const output = result.stdout + result.stderr;
            
            // Look for success indicators
            if (output.toLowerCase().includes('complete') || 
                output.toLowerCase().includes('collection complete') ||
                output.includes('.tgz') || 
                output.includes('saved to') ||
                output.includes('support file')) {
                
                // Extract log file path if present
                const match = output.match(/saved to (.+\.tgz)/i);
                if (match) {
                    return `Logs collected successfully.\nFile: ${match[1]}`;
                }
                return output || 'Log collection completed';
            }

            // If no success indicators, throw error
            throw new Error(result.stderr || output || 'Log collection failed');
        } catch (e) {
            ErrorHandler.handle(e, 'Log collection failed', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get available gateways (with caching)
     * @returns {Promise<Array<{name: string, address: string, preferred: boolean}>>} List of available gateways
     */
    async getGateways() {
        try {
            // Get list of all available gateways using --manual-gateway
            const manualResult = await this._executeCommand(['show', '--manual-gateway'], 5);
            
            // Get current gateway details
            const detailsResult = await this._executeCommand(['show', '--details'], 5);
            
            const gateways = [];
            const lines = (manualResult.stdout + manualResult.stderr).split('\n');
            
            // Find current gateway from details
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
            
            // Parse gateway list
            // Format: Name                Address            Preferred
            // vpn-eu.epam.com     vpn-eu.epam.com
            let inGatewayList = false;
            for (const line of lines) {
                const trimmed = line.trim();
                
                // Skip empty lines
                if (trimmed === '') {
                    continue;
                }
                
                // Skip header line
                if (trimmed.startsWith('Name')) {
                    continue;
                }
                
                // Separator line indicates start of gateway list
                if (trimmed.startsWith('---')) {
                    inGatewayList = true;
                    continue;
                }
                
                if (inGatewayList) {
                    // Parse gateway line: "vpn-us.epam.com     vpn-us.epam.com"
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
            ErrorHandler.handle(e, 'Failed to get gateways', {notify: false, log: true});
            return [];
        }
    }

    /**
     * Set preferred gateway
     * @param {string} gateway - Gateway address
     * @returns {Promise<string>} Command result
     */
    async setPreferredGateway(gateway) {
        try {
            const result = await this._executeCommand(['set-preferred-gateway', gateway], 10);
            
            const output = result.stdout + result.stderr;
            if (output.toLowerCase().includes('success') || output.toLowerCase().includes('set')) {
                return `Preferred gateway set to ${gateway}`;
            }
            
            if (!result.success) {
                throw new Error(result.stderr || 'Failed to set preferred gateway');
            }
            
            return result.stdout || `Preferred gateway set to ${gateway}`;
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to set preferred gateway', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get help information with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Help text
     */
    async getHelp(retryCount = 0) {
        try {
            const result = await this._executeCommand(['show', '--help'], 5);
            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in getHelp. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.getHelp(retryCount + 1);
                }
            }
            
            return result.stdout || result.stderr || 'No help available';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get help', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Extract log file path from collect-log output
     * @param {string} output - Command output
     * @returns {string|null} Log file path or null
     */
    extractLogFilePath(output) {
        const match = output.match(/saved to (.+\.tgz)/i);
        return match ? match[1] : null;
    }

    /**
     * Connect directly to a gateway with retry logic
     * @param {string} gateway - Gateway address
     * @param {Function} statusCallback - Optional callback for status updates
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<{success: boolean, message: string}>} Connection result
     */
    async connectToGateway(gateway, statusCallback = null, retryCount = 0) {
        try {
            if (!gateway) {
                throw new Error('Gateway address is required');
            }

            if (statusCallback) {
                statusCallback('connecting', retryCount > 0 ? `Retrying gateway connection (attempt ${retryCount + 1})...` : 'Connecting to gateway...');
            }

            const result = await this._executeCommand(['connect', '--gateway', gateway], 30);

            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in gateway connect. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.connectToGateway(gateway, statusCallback, retryCount + 1);
                }
                // Check if already connected
                const status = await this.getStatus();
                if (status.connected) {
                    log('GlobalProtect: Already connected to gateway');
                    return {
                        success: true,
                        message: 'Already connected'
                    };
                }
            }
            
            const success = output.toLowerCase().includes('connected') || result.success;

            if (statusCallback) {
                statusCallback(success ? 'connected' : 'failed', success ? 'Connected to gateway' : 'Connection failed');
            }

            return {
                success: success,
                message: result.stdout || result.stderr || 'Connected to gateway'
            };
        } catch (e) {
            ErrorHandler.handle(e, 'Gateway connection failed', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get GlobalProtect version with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Version information
     */
    async getVersion(retryCount = 0) {
        try {
            const result = await this._executeCommand(['show', '--version'], 5);
            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in getVersion. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.getVersion(retryCount + 1);
                }
            }
            
            return result.stdout || result.stderr || 'Version unknown';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get version', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get errors from GlobalProtect with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Error information
     */
    async getErrors(retryCount = 0) {
        try {
            const result = await this._executeCommand(['show', '--error'], 5);
            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in getErrors. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.getErrors(retryCount + 1);
                }
            }
            
            const cleanOutput = result.stdout || result.stderr || 'No errors reported';
            return cleanOutput.trim() || 'No errors reported';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get errors', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Remove user credentials
     * @returns {Promise<string>} Command result
     */
    async removeUser() {
        try {
            // This command requires interactive confirmation (y/n)
            // We'll need to handle this differently
            const result = await this._executeCommand(['remove-user'], 10);
            
            const output = result.stdout + result.stderr;
            if (output.toLowerCase().includes('success') || output.toLowerCase().includes('cleared')) {
                return 'Credentials cleared successfully';
            }
            
            return result.stdout || result.stderr || 'Credentials cleared';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to remove user', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get connection details (Gateway Name, IPs, etc.)
     * @returns {Promise<Object>} Connection details object
     */
    async getConnectionDetails() {
        try {
            const result = await this._executeCommand(['show', '--details'], 5);
            
            const details = {
                gatewayName: null,
                gatewayDescription: null,
                assignedIp: null,
                gatewayIp: null,
                gatewayLocation: null,
                protocol: null,
                uptime: null
            };
            
            const lines = (result.stdout + result.stderr).split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                const lowerLine = trimmed.toLowerCase();
                
                if (lowerLine.startsWith('gateway name:')) {
                    details.gatewayName = trimmed.split(':').slice(1).join(':').trim();
                } else if (lowerLine.startsWith('gateway description:')) {
                    details.gatewayDescription = trimmed.split(':').slice(1).join(':').trim();
                } else if (lowerLine.startsWith('assigned ip address:')) {
                    details.assignedIp = trimmed.split(':').slice(1).join(':').trim();
                } else if (lowerLine.startsWith('gateway ip address:')) {
                    details.gatewayIp = trimmed.split(':').slice(1).join(':').trim();
                } else if (lowerLine.startsWith('gateway location:')) {
                    details.gatewayLocation = trimmed.split(':').slice(1).join(':').trim();
                } else if (lowerLine.startsWith('protocol:')) {
                    details.protocol = trimmed.split(':').slice(1).join(':').trim();
                } else if (lowerLine.startsWith('uptime(sec):')) {
                    details.uptime = trimmed.split(':').slice(1).join(':').trim();
                }
            }
            
            return details;
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get connection details', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get host state (HIP information) with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Host state information
     */
    async getHostState(retryCount = 0) {
        try {
            const result = await this._executeCommand(['show', '--host-state'], 5);
            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in getHostState. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.getHostState(retryCount + 1);
                }
            }
            
            return result.stdout || result.stderr || 'No host state information available';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get host state', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Get GlobalProtect notifications with retry logic
     * @param {number} retryCount - Internal retry counter
     * @returns {Promise<string>} Notifications
     */
    async getNotifications(retryCount = 0) {
        try {
            const result = await this._executeCommand(['show', '--notification'], 5);
            const output = result.stdout + result.stderr;
            
            // Check for "already established" error
            if (output.includes('already established') || output.includes('Unable to establish a new GlobalProtect connection')) {
                if (retryCount < 2) {
                    log(`GlobalProtect CLI bug detected in getNotifications. Retrying (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.getNotifications(retryCount + 1);
                }
            }
            
            const cleanOutput = result.stdout || result.stderr || 'No notifications';
            return cleanOutput.trim() || 'No notifications';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to get notifications', {notify: false, log: true});
            throw e;
        }
    }

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

    /**
     * Import client certificate
     * @param {string} certPath - Path to certificate file
     * @returns {Promise<string>} Command result
     */
    async importCertificate(certPath) {
        try {
            if (!certPath) {
                throw new Error('Certificate path is required');
            }
            
            const result = await this._executeCommand(['import-certificate', certPath], 10);
            const output = result.stdout + result.stderr;
            
            if (output.toLowerCase().includes('success') || 
                output.toLowerCase().includes('imported') ||
                output.toLowerCase().includes('complete')) {
                return result.stdout || result.stderr || 'Certificate imported successfully';
            }
            
            if (result.stderr && result.stderr.toLowerCase().includes('error')) {
                throw new Error(result.stderr);
            }
            
            return result.stdout || result.stderr || 'Certificate imported';
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to import certificate', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Set SSL only configuration
     * @param {boolean} sslOnly - Enable SSL only mode
     * @returns {Promise<string>} Command result
     */
    async setConfig(sslOnly) {
        try {
            const value = sslOnly ? 'yes' : 'no';
            const result = await this._executeCommand(['set-config', '--ssl-only', value], 10);
            const output = result.stdout + result.stderr;
            
            if (output.toLowerCase().includes('success') || 
                output.toLowerCase().includes('set') ||
                output.toLowerCase().includes('updated')) {
                return `SSL only mode ${sslOnly ? 'enabled' : 'disabled'}`;
            }
            
            return result.stdout || result.stderr || `SSL only mode ${sslOnly ? 'enabled' : 'disabled'}`;
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to set config', {notify: false, log: true});
            throw e;
        }
    }

    /**
     * Set log level
     * @param {string} level - Log level (error, warning, info, debug)
     * @returns {Promise<string>} Command result
     */
    async setLogLevel(level) {
        try {
            const validLevels = ['error', 'warning', 'info', 'debug'];
            if (!validLevels.includes(level.toLowerCase())) {
                throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
            }
            
            const result = await this._executeCommand(['set-log', level.toLowerCase()], 10);
            const output = result.stdout + result.stderr;
            
            if (output.toLowerCase().includes('success') || 
                output.toLowerCase().includes('set') ||
                output.toLowerCase().includes('updated')) {
                return `Log level set to: ${level}`;
            }
            
            return result.stdout || result.stderr || `Log level set to: ${level}`;
        } catch (e) {
            ErrorHandler.handle(e, 'Failed to set log level', {notify: false, log: true});
            throw e;
        }
    }
}
