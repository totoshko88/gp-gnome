/*
 * GlobalProtect VPN Indicator - teardown decision helper
 * GNOME Shell Extension
 *
 * Copyright (C) 2025 Anton Isaiev <totoshko88@gmail.com>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Decide whether the extension's disable() should disconnect the VPN.
 *
 * Pure function extracted so it can be unit-tested under plain Node without the
 * GNOME Shell import graph. extension.js's _shouldDisconnectOnDisable() delegates
 * to this.
 *
 * GNOME switches the session mode to 'unlock-dialog' when the screen locks. With
 * session-modes declared the extension survives the lock, but disable() can still
 * run during a lock transition, so the VPN must not be torn down on a lock unless
 * the user opted in.
 *
 * @param {string} currentMode - Main.sessionMode.currentMode value.
 * @param {object} settings - GSettings-like object (get_boolean), or null.
 * @returns {boolean} true if the VPN should be disconnected.
 */
export function shouldDisconnectOnDisable(currentMode, settings) {
    const isLock = currentMode === 'unlock-dialog';

    // Safe defaults when settings are unavailable: keep VPN on lock,
    // disconnect on a real teardown (logout).
    if (!settings) {
        return !isLock;
    }

    if (isLock) {
        return settings.get_boolean('disconnect-on-lock');
    }

    return settings.get_boolean('auto-disconnect-on-logout');
}
