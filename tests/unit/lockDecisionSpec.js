import {shouldDisconnectOnDisable} from '../../lockDecision.js';
import {MockSettings} from '../mocks/gnome-mocks.js';

// Mirrors extension.js's GlobalProtectExtension._shouldDisconnectOnDisable(),
// which delegates to shouldDisconnectOnDisable(). Exercises the full matrix:
// {currentMode in [user, unlock-dialog]} x {disconnect-on-lock,
// auto-disconnect-on-logout flags}, asserting the returned bool.

function settingsWith(disconnectOnLock, autoDisconnectOnLogout) {
    const s = new MockSettings();
    s.set_boolean('disconnect-on-lock', disconnectOnLock);
    s.set_boolean('auto-disconnect-on-logout', autoDisconnectOnLogout);
    return s;
}

describe('shouldDisconnectOnDisable (teardown decision)', () => {
    describe('on screen lock (currentMode === "unlock-dialog")', () => {
        it('keeps VPN connected when disconnect-on-lock is false', () => {
            expect(shouldDisconnectOnDisable('unlock-dialog', settingsWith(false, true))).toBe(false);
            expect(shouldDisconnectOnDisable('unlock-dialog', settingsWith(false, false))).toBe(false);
        });

        it('disconnects when disconnect-on-lock is true', () => {
            expect(shouldDisconnectOnDisable('unlock-dialog', settingsWith(true, true))).toBe(true);
            expect(shouldDisconnectOnDisable('unlock-dialog', settingsWith(true, false))).toBe(true);
        });
    });

    describe('on real teardown (currentMode === "user")', () => {
        it('disconnects when auto-disconnect-on-logout is true', () => {
            expect(shouldDisconnectOnDisable('user', settingsWith(false, true))).toBe(true);
            expect(shouldDisconnectOnDisable('user', settingsWith(true, true))).toBe(true);
        });

        it('keeps VPN connected when auto-disconnect-on-logout is false', () => {
            expect(shouldDisconnectOnDisable('user', settingsWith(false, false))).toBe(false);
            expect(shouldDisconnectOnDisable('user', settingsWith(true, false))).toBe(false);
        });
    });

    describe('with null settings (safe defaults)', () => {
        it('keeps VPN connected on lock', () => {
            expect(shouldDisconnectOnDisable('unlock-dialog', null)).toBe(false);
        });

        it('disconnects on real teardown', () => {
            expect(shouldDisconnectOnDisable('user', null)).toBe(true);
        });
    });

    describe('schema defaults (disconnect-on-lock=false, auto-disconnect-on-logout=true)', () => {
        it('matches the #4 fix: stay connected on lock, disconnect on logout', () => {
            const defaults = new MockSettings();
            expect(shouldDisconnectOnDisable('unlock-dialog', defaults)).toBe(false);
            expect(shouldDisconnectOnDisable('user', defaults)).toBe(true);
        });
    });
});
