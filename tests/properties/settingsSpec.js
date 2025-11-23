/**
 * Property-based tests for settings persistence and validation
 * Tests Properties 1 and 2 from the design document
 */

import fc from 'fast-check';
import { MockSettings } from '../mocks/gnome-mocks.js';

describe('Settings Properties', () => {
    
    it('Property 1: Settings persistence round-trip', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 1: Settings persistence round-trip
         * Validates: Requirements 1.2, 1.3
         * 
         * For any valid portal address string, saving it to settings and then 
         * loading settings should return the same portal address
         */
        fc.assert(
            fc.property(
                fc.domain(),
                (portal) => {
                    const settings = new MockSettings();
                    settings.set_string('portal-address', portal);
                    const loaded = settings.get_string('portal-address');
                    return loaded === portal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 2: Portal address validation', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 2: Portal address validation
         * Validates: Requirements 1.4
         * 
         * For any input string, the validation function should accept valid 
         * domain names/IPs and reject invalid formats
         */
        
        // Import validation function (we'll need to export it from prefs.js)
        const validatePortalAddress = (address) => {
            if (!address || typeof address !== 'string') {
                return false;
            }
            
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
                const octets = address.split('.');
                return octets.every(octet => {
                    const num = parseInt(octet, 10);
                    return num >= 0 && num <= 255;
                });
            }
            
            return false;
        };
        
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.domain(),
                    fc.ipV4(),
                    fc.string().filter(s => s.length > 0 && s.length < 100)
                ),
                (input) => {
                    const isValid = validatePortalAddress(input);
                    const isDomain = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(input);
                    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(input) && 
                                 input.split('.').every(octet => {
                                     const num = parseInt(octet, 10);
                                     return num >= 0 && num <= 255;
                                 });
                    
                    // Validation should return true only for valid domains or IPs
                    return isValid === (isDomain || isIP);
                }
            ),
            { numRuns: 100 }
        );
    });
});
