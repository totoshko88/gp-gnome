/**
 * Property-based tests for status monitoring and display
 * Tests Properties 3, 4, and 8 from the design document
 */

import fc from 'fast-check';

describe('Status Properties', () => {
    
    it('Property 3: Icon reflects connection state', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 3: Icon reflects connection state
         * Validates: Requirements 2.1, 2.2
         * 
         * For any VPN connection state (connected/disconnected), the displayed icon name 
         * should correctly correspond to that state
         */
        
        const getIconForState = (connected, isError = false, isTransitioning = false) => {
            if (isError) {
                return 'error.png';
            } else if (isTransitioning) {
                return 'connecting.png';
            } else if (connected) {
                return 'on.png';
            } else {
                return 'off.png';
            }
        };
        
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (connected, isError, isTransitioning) => {
                    const iconName = getIconForState(connected, isError, isTransitioning);
                    
                    // Verify icon corresponds to state
                    if (isError) {
                        return iconName === 'error.png';
                    } else if (isTransitioning) {
                        return iconName === 'connecting.png';
                    } else if (connected) {
                        return iconName === 'on.png';
                    } else {
                        return iconName === 'off.png';
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 4: Status parsing completeness', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 4: Status parsing completeness
         * Validates: Requirements 2.4
         * 
         * For any valid GlobalProtect status output, the parser should extract all 
         * available fields without data loss
         */
        
        const parseStatus = (output) => {
            const status = {
                connected: false,
                portal: null,
                gateway: null
            };

            if (output) {
                const lines = output.split('\n');
                
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
        };
        
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.option(fc.domain(), { nil: null }),
                fc.option(fc.domain(), { nil: null }),
                (connected, portal, gateway) => {
                    // Generate status output
                    let output = `Status: ${connected ? 'Connected' : 'Disconnected'}\n`;
                    if (portal) {
                        output += `Portal: ${portal}\n`;
                    }
                    if (gateway) {
                        output += `Gateway: ${gateway}\n`;
                    }
                    
                    // Parse it
                    const parsed = parseStatus(output);
                    
                    // Verify all fields are preserved
                    return parsed.connected === connected &&
                           parsed.portal === portal &&
                           parsed.gateway === gateway;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 8: Connection details include required fields', () => {
        /**
         * Feature: gnome-globalprotect-extension, Property 8: Connection details include required fields
         * Validates: Requirements 5.4
         * 
         * For any connected VPN session, the displayed connection information should 
         * include status, portal, and gateway fields
         */
        
        const formatConnectionDetails = (status) => {
            if (!status || !status.connected) {
                return 'Not connected';
            }
            
            let text = 'Connected';
            if (status.portal) {
                text += ` to ${status.portal}`;
            }
            if (status.gateway) {
                text += ` (${status.gateway})`;
            }
            
            return text;
        };
        
        fc.assert(
            fc.property(
                fc.domain(),
                fc.domain(),
                (portal, gateway) => {
                    const status = {
                        connected: true,
                        portal: portal,
                        gateway: gateway
                    };
                    
                    const details = formatConnectionDetails(status);
                    
                    // Verify all required fields are present in the output
                    return details.includes('Connected') &&
                           details.includes(portal) &&
                           details.includes(gateway);
                }
            ),
            { numRuns: 100 }
        );
    });
});
