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

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {ErrorHandler} from './errorHandler.js';

/**
 * Validates portal address format (domain name or IP address)
 * @param {string} address - The portal address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePortalAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    
    // Trim whitespace
    address = address.trim();
    
    if (address.length === 0) {
        return false;
    }
    
    // Check for valid domain name
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (domainRegex.test(address)) {
        return true;
    }
    
    // Check for valid IPv4 address
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(address)) {
        // Validate each octet is 0-255
        const octets = address.split('.');
        return octets.every(octet => {
            const num = parseInt(octet, 10);
            return num >= 0 && num <= 255;
        });
    }
    
    return false;
}

export default class GlobalProtectPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create preferences page
        const page = new Adw.PreferencesPage();
            
            // Create about group
            const aboutGroup = new Adw.PreferencesGroup({
                title: 'About',
                description: 'Native GNOME extension for full-featured GlobalProtect CLI integration'
            });
            
            // Add description row
            const descRow = new Adw.ActionRow({
                title: 'Description',
                subtitle: 'Provides complete VPN management with native GNOME integration, comprehensive functionality, and intelligent handling of known CLI issues.'
            });
            aboutGroup.add(descRow);
            
            // Add features row
            const featuresRow = new Adw.ActionRow({
                title: 'Features',
                subtitle: '• Connect/disconnect with MFA support\n• Real-time connection monitoring\n• Gateway selection and switching\n• Interactive settings configuration\n• Advanced operations (HIP, logs, network rediscovery)\n• Automatic retry logic for CLI bugs\n• Auto-disconnect on logout'
            });
            aboutGroup.add(featuresRow);
            
            // Add author row
            const authorRow = new Adw.ActionRow({
                title: 'Author',
                subtitle: 'Anton Isaiev (totoshko88@gmail.com)'
            });
            aboutGroup.add(authorRow);
            
            // Add repository row
            const repoRow = new Adw.ActionRow({
                title: 'Repository',
                subtitle: 'https://github.com/totoshko88/gp-gnome'
            });
            aboutGroup.add(repoRow);
            
            page.add(aboutGroup);
            
            // Create connection settings group
            const group = new Adw.PreferencesGroup({
                title: 'Connection Settings',
                description: 'Configure GlobalProtect VPN connection'
            });
            
            // Get settings
            const settings = this.getSettings();
        
        // Portal address entry
        const portalRow = new Adw.EntryRow({
            title: 'Portal Address',
            text: settings.get_string('portal-address')
        });
        
        // Add validation styling
        portalRow.add_css_class('portal-address-entry');
        
        // Validation state tracking
        let isValid = true;
        
        // Create validation feedback label (initially hidden)
        const validationLabel = new Gtk.Label({
            label: '',
            css_classes: ['error', 'caption'],
            visible: false,
            xalign: 0
        });
        
        // Connect to text changes for validation
        portalRow.connect('changed', (widget) => {
            const address = widget.text;
            const valid = validatePortalAddress(address);
            
            if (valid) {
                // Valid address - save to settings
                settings.set_string('portal-address', address);
                portalRow.remove_css_class('error');
                validationLabel.visible = false;
                isValid = true;
            } else {
                // Invalid address - show error
                portalRow.add_css_class('error');
                validationLabel.label = 'Invalid portal address. Enter a valid domain name or IP address.';
                validationLabel.visible = true;
                isValid = false;
            }
        });
        
        // Add rows to group
        group.add(portalRow);
        
        // Add validation label as a separate row
        const validationBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_start: 12,
            margin_end: 12,
            margin_top: 0,
            margin_bottom: 6
        });
        validationBox.append(validationLabel);
        
        const validationRow = new Adw.PreferencesRow({
            child: validationBox,
            activatable: false
        });
        group.add(validationRow);
        
        // Add group to page
        page.add(group);
        
        // Add page to window
        window.add(page);
    }
}
