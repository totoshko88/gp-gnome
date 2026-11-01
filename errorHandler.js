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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * ErrorHandler - Centralized error handling utility
 * Provides consistent error handling across the extension with logging,
 * user notifications, and sensitive data sanitization
 *
 * Notification System:
 * - Uses Main.notifyError() for error notifications (red/warning style)
 * - Success notifications use Main.notify() (called from indicator.js)
 * - Ensures notifications are not excessive through throttling in indicator
 */
export class ErrorHandler {
    /**
     * Handle an error with logging, notification, and UI updates
     * Uses Main.notifyError() to display error notifications to the user
     *
     * @param {Error} error - The error object
     * @param {string} context - Context description (e.g., 'Connection failed')
     * @param {Object} options - Optional configuration
     * @param {boolean} options.notify - Whether to show notification (default: true)
     * @param {boolean} options.log - Whether to log error (default: true)
     * @param {Function} options.uiCallback - Optional callback for UI updates
     */
    static handle(error, context, options = {}) {
        const {
            notify = true,
            log = true,
            uiCallback = null
        } = options;

        const userMessage = this._getUserMessage(error);

        if (log) {
            const sanitizedMessage = this._sanitizeForLog(error.message || error.toString());
            console.error(`gp-gnome: ${context}: ${sanitizedMessage}`);
        }

        if (notify) {
            Main.notifyError('GlobalProtect Error', userMessage);
        }

        if (uiCallback && typeof uiCallback === 'function') {
            uiCallback(error, userMessage);
        }
    }

    /**
     * Get user-friendly error message
     * Converts technical errors into messages users can understand
     * @param {Error} error - The error object
     * @returns {string} User-friendly error message
     * @private
     */
    static _getUserMessage(error) {
        const message = error.message || error.toString();
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('not installed') ||
            lowerMessage.includes('not in path') ||
            lowerMessage.includes('command not found')) {
            return 'GlobalProtect CLI is not installed or not in PATH';
        }

        if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
            return 'Operation timed out. Please try again.';
        }

        if (lowerMessage.includes('authentication') ||
            lowerMessage.includes('auth') ||
            lowerMessage.includes('credentials')) {
            return 'Authentication failed. Please check your credentials.';
        }

        if (lowerMessage.includes('portal')) {
            return 'Invalid portal address or portal unreachable';
        }

        if (lowerMessage.includes('network') ||
            lowerMessage.includes('connection refused') ||
            lowerMessage.includes('unreachable')) {
            return 'Network error. Please check your connection.';
        }

        if (lowerMessage.includes('permission') ||
            lowerMessage.includes('access denied')) {
            return 'Permission denied. You may need administrator privileges.';
        }

        if (lowerMessage.includes('mfa') ||
            lowerMessage.includes('multi-factor') ||
            lowerMessage.includes('2fa')) {
            return 'Multi-factor authentication required or failed';
        }

        if (lowerMessage.includes('configuration') ||
            lowerMessage.includes('config')) {
            return 'Configuration error. Please check your settings.';
        }

        return this._sanitizeForUser(message);
    }

    /**
     * Sanitize error message for logging
     * Removes sensitive information like passwords, tokens, cookies
     * @param {string} message - Error message to sanitize
     * @returns {string} Sanitized message
     * @private
     */
    static _sanitizeForLog(message) {
        if (!message || typeof message !== 'string') {
            return String(message || 'Unknown error');
        }

        let sanitized = message;

        sanitized = sanitized.replace(/password[=:]\s*\S+/gi, 'password=***');
        sanitized = sanitized.replace(/passwd[=:]\s*\S+/gi, 'passwd=***');
        sanitized = sanitized.replace(/pwd[=:]\s*\S+/gi, 'pwd=***');

        sanitized = sanitized.replace(/token[=:]\s*\S+/gi, 'token=***');
        sanitized = sanitized.replace(/bearer\s+\S+/gi, 'bearer ***');
        sanitized = sanitized.replace(/authorization[=:]\s*\S+/gi, 'authorization=***');

        sanitized = sanitized.replace(/cookie[=:]\s*\S+/gi, 'cookie=***');
        sanitized = sanitized.replace(/set-cookie[=:]\s*\S+/gi, 'set-cookie=***');

        sanitized = sanitized.replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
        sanitized = sanitized.replace(/key[=:]\s*\S+/gi, 'key=***');

        sanitized = sanitized.replace(/secret[=:]\s*\S+/gi, 'secret=***');

        sanitized = sanitized.replace(/session[_-]?id[=:]\s*\S+/gi, 'session_id=***');
        sanitized = sanitized.replace(/sessionid[=:]\s*\S+/gi, 'sessionid=***');

        return sanitized;
    }

    /**
     * Sanitize error message for user display
     * Less aggressive than log sanitization, but still removes obvious secrets
     * @param {string} message - Error message to sanitize
     * @returns {string} Sanitized message
     * @private
     */
    static _sanitizeForUser(message) {
        if (!message || typeof message !== 'string') {
            return 'An error occurred. Please check the logs for details.';
        }

        if (message.length > 200) {
            message = `${message.substring(0, 197)}...`;
        }

        let sanitized = this._sanitizeForLog(message);

        if (sanitized.includes('Error:')) {
            sanitized = sanitized.replace(/^Error:\s*/i, '');
        }

        return sanitized || 'An error occurred. Please check the logs for details.';
    }

    /**
     * Handle async operation with automatic error handling
     * Wraps an async function with try-catch and error handling
     * @param {Function} asyncFn - Async function to execute
     * @param {string} context - Context description
     * @param {Object} options - Error handling options
     * @returns {Promise<any>} Result of async function or null on error
     */
    static async handleAsync(asyncFn, context, options = {}) {
        try {
            return await asyncFn();
        } catch (error) {
            this.handle(error, context, options);
            return null;
        }
    }
}
