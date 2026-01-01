/*
 * GlobalProtect VPN Indicator - Preferences
 * GNOME Shell Extension
 *
 * Copyright (C) 2025 Anton Isaiev <totoshko88@gmail.com>
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

function isValidPortal(address) {
    if (!address || address.trim().length === 0) return false;
    const domainRegex = /^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (domainRegex.test(address)) return true;
    if (ipv4Regex.test(address)) {
        return address.split('.').every(o => parseInt(o) <= 255);
    }
    return false;
}

export default class GlobalProtectPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'preferences-system-symbolic'
        });

        // Connection group
        const portalGroup = new Adw.PreferencesGroup({
            title: _('Connection'),
            description: _('VPN portal configuration')
        });

        const portalRow = new Adw.EntryRow({
            title: _('Portal Address'),
            text: settings.get_string('portal-address')
        });
        portalRow.connect('changed', row => {
            const addr = row.text.trim();
            if (isValidPortal(addr)) {
                settings.set_string('portal-address', addr);
                portalRow.remove_css_class('error');
            } else {
                portalRow.add_css_class('error');
            }
        });
        portalGroup.add(portalRow);

        const usernameRow = new Adw.EntryRow({
            title: _('Username (optional)'),
            text: settings.get_string('username')
        });
        usernameRow.connect('changed', row => {
            settings.set_string('username', row.text);
        });
        portalGroup.add(usernameRow);

        page.add(portalGroup);

        // Options group
        const optionsGroup = new Adw.PreferencesGroup({
            title: _('Options')
        });

        const sslRow = new Adw.SwitchRow({
            title: _('SSL Only Mode'),
            subtitle: _('Force SSL-only connections')
        });
        settings.bind('ssl-only', sslRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        optionsGroup.add(sslRow);

        const pollRow = new Adw.SpinRow.new_with_range(3, 60, 1);
        pollRow.title = _('Poll Interval (seconds)');
        pollRow.subtitle = _('How often to check VPN status');
        settings.bind('poll-interval', pollRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        optionsGroup.add(pollRow);

        page.add(optionsGroup);

        // About group
        const aboutGroup = new Adw.PreferencesGroup({
            title: _('About')
        });

        aboutGroup.add(new Adw.ActionRow({
            title: 'gp-gnome',
            subtitle: 'Version 1.3.7 | Anton Isaiev'
        }));

        aboutGroup.add(new Adw.ActionRow({
            title: _('Repository'),
            subtitle: 'github.com/totoshko88/gp-gnome'
        }));

        page.add(aboutGroup);
        window.add(page);
    }
}
