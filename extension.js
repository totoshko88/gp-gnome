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

export default class GlobalProtectExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
        this._gpClient = null;
        this._statusMonitor = null;
        this._settings = null;
    }

    enable() {
        this._settings = this.getSettings();
        this._gpClient = new GlobalProtectClient(this._settings);
        this._statusMonitor = new StatusMonitor(this._gpClient, this._settings);
        this._indicator = new GlobalProtectIndicator(
            this._gpClient,
            this._statusMonitor,
            this._settings,
            this.path,
            () => this.openPreferences()
        );

        Main.panel.addToStatusArea(this.uuid, this._indicator);
        this._statusMonitor.start();
    }

    disable() {
        if (this._statusMonitor) {
            this._statusMonitor.destroy();
            this._statusMonitor = null;
        }

        if (this._gpClient) {
            this._gpClient.destroy();
            this._gpClient = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }
}
