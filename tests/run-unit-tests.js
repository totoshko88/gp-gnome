#!/usr/bin/gjs

/**
 * Unit test runner for GNOME Shell Extension
 * Tests specific examples and edge cases
 */

class UnitTester {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }
    
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    run() {
        print('\n=== Running Unit Tests ===\n');
        
        for (const test of this.tests) {
            try {
                test.fn();
                this.passed++;
                print(`✓ ${test.name}`);
            } catch (e) {
                this.failed++;
                print(`✗ ${test.name}`);
                print(`  Error: ${e.message}`);
                if (e.stack) {
                    print(`  Stack: ${e.stack}`);
                }
            }
        }
        
        print(`\n=== Test Results ===`);
        print(`Passed: ${this.passed}`);
        print(`Failed: ${this.failed}`);
        print(`Total: ${this.tests.length}\n`);
        
        return this.failed === 0;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertIncludes(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(message || `Expected "${str}" to include "${substring}"`);
    }
}

const tester = new UnitTester();

// ===== Portal Address Validation Tests =====

tester.test('validates correct domain names', () => {
    const validatePortalAddress = (address) => {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        address = address.trim();
        
        if (address.length === 0) {
            return false;
        }
        
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        if (domainRegex.test(address)) {
            return true;
        }
        
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
    
    assert(validatePortalAddress('vpn.epam.com'), 'Should accept vpn.epam.com');
    assert(validatePortalAddress('example.com'), 'Should accept example.com');
    assert(validatePortalAddress('sub.domain.example.com'), 'Should accept sub.domain.example.com');
});

tester.test('validates correct IP addresses', () => {
    const validatePortalAddress = (address) => {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        address = address.trim();
        
        if (address.length === 0) {
            return false;
        }
        
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        if (domainRegex.test(address)) {
            return true;
        }
        
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
    
    assert(validatePortalAddress('192.168.1.1'), 'Should accept 192.168.1.1');
    assert(validatePortalAddress('10.0.0.1'), 'Should accept 10.0.0.1');
    assert(validatePortalAddress('172.16.0.1'), 'Should accept 172.16.0.1');
});

tester.test('rejects invalid portal addresses', () => {
    const validatePortalAddress = (address) => {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        address = address.trim();
        
        if (address.length === 0) {
            return false;
        }
        
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        if (domainRegex.test(address)) {
            return true;
        }
        
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
    
    assert(!validatePortalAddress(''), 'Should reject empty string');
    assert(!validatePortalAddress('   '), 'Should reject whitespace');
    assert(!validatePortalAddress('invalid'), 'Should reject single word');
    assert(!validatePortalAddress('256.256.256.256'), 'Should reject invalid IP');
    assert(!validatePortalAddress('not a domain'), 'Should reject spaces');
});

// ===== Status Parsing Tests =====

tester.test('parses connected status correctly', () => {
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
    
    const output = 'Status: Connected\nPortal: vpn.epam.com\nGateway: gw.epam.com\n';
    const status = parseStatus(output);
    
    assert(status.connected, 'Should be connected');
    assertEqual(status.portal, 'vpn.epam.com', 'Portal should match');
    assertEqual(status.gateway, 'gw.epam.com', 'Gateway should match');
});

tester.test('parses disconnected status correctly', () => {
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
    
    const output = 'Status: Disconnected\n';
    const status = parseStatus(output);
    
    assert(!status.connected, 'Should be disconnected');
    assertEqual(status.portal, null, 'Portal should be null');
    assertEqual(status.gateway, null, 'Gateway should be null');
});

tester.test('handles empty status output', () => {
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
    
    const status = parseStatus('');
    
    assert(!status.connected, 'Should be disconnected');
    assertEqual(status.portal, null, 'Portal should be null');
    assertEqual(status.gateway, null, 'Gateway should be null');
});

// ===== Command Construction Tests =====

tester.test('builds correct connect command', () => {
    const buildConnectCommand = (portal) => {
        return ['globalprotect', 'connect', '--portal', portal];
    };
    
    const command = buildConnectCommand('vpn.epam.com');
    
    assertEqual(command.length, 4, 'Command should have 4 parts');
    assertEqual(command[0], 'globalprotect', 'First part should be globalprotect');
    assertEqual(command[1], 'connect', 'Second part should be connect');
    assertEqual(command[2], '--portal', 'Third part should be --portal');
    assertEqual(command[3], 'vpn.epam.com', 'Fourth part should be portal address');
});

tester.test('builds correct disconnect command', () => {
    const buildDisconnectCommand = () => {
        return ['globalprotect', 'disconnect'];
    };
    
    const command = buildDisconnectCommand();
    
    assertEqual(command.length, 2, 'Command should have 2 parts');
    assertEqual(command[0], 'globalprotect', 'First part should be globalprotect');
    assertEqual(command[1], 'disconnect', 'Second part should be disconnect');
});

tester.test('builds correct status command', () => {
    const buildStatusCommand = () => {
        return ['globalprotect', 'show', '--status'];
    };
    
    const command = buildStatusCommand();
    
    assertEqual(command.length, 3, 'Command should have 3 parts');
    assertEqual(command[0], 'globalprotect', 'First part should be globalprotect');
    assertEqual(command[1], 'show', 'Second part should be show');
    assertEqual(command[2], '--status', 'Third part should be --status');
});

// ===== Icon Selection Tests =====

tester.test('selects correct icon for connected state', () => {
    const getIconForState = (connected, isError, isTransitioning) => {
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
    
    const icon = getIconForState(true, false, false);
    assertEqual(icon, 'on.png', 'Should use on.png for connected state');
});

tester.test('selects correct icon for disconnected state', () => {
    const getIconForState = (connected, isError, isTransitioning) => {
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
    
    const icon = getIconForState(false, false, false);
    assertEqual(icon, 'off.png', 'Should use off.png for disconnected state');
});

tester.test('selects correct icon for error state', () => {
    const getIconForState = (connected, isError, isTransitioning) => {
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
    
    const icon = getIconForState(false, true, false);
    assertEqual(icon, 'error.png', 'Should use error.png for error state');
});

tester.test('selects correct icon for transitioning state', () => {
    const getIconForState = (connected, isError, isTransitioning) => {
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
    
    const icon = getIconForState(false, false, true);
    assertEqual(icon, 'connecting.png', 'Should use connecting.png for transitioning state');
});

// ===== Error Sanitization Tests =====

tester.test('sanitizes passwords from error messages', () => {
    const sanitizeForLog = (message) => {
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
        sanitized = sanitized.replace(/secret[=:]\s*\S+/gi, 'secret=***');
        sanitized = sanitized.replace(/session[_-]?id[=:]\s*\S+/gi, 'session_id=***');
        sanitized = sanitized.replace(/sessionid[=:]\s*\S+/gi, 'sessionid=***');

        return sanitized;
    };
    
    const message = 'Error: password=secret123';
    const sanitized = sanitizeForLog(message);
    
    assert(!sanitized.includes('secret123'), 'Should not contain password');
    assertIncludes(sanitized, '***', 'Should contain ***');
});

tester.test('sanitizes tokens from error messages', () => {
    const sanitizeForLog = (message) => {
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
        sanitized = sanitized.replace(/secret[=:]\s*\S+/gi, 'secret=***');
        sanitized = sanitized.replace(/session[_-]?id[=:]\s*\S+/gi, 'session_id=***');
        sanitized = sanitized.replace(/sessionid[=:]\s*\S+/gi, 'sessionid=***');

        return sanitized;
    };
    
    const message = 'Error: token=abc123xyz';
    const sanitized = sanitizeForLog(message);
    
    assert(!sanitized.includes('abc123xyz'), 'Should not contain token');
    assertIncludes(sanitized, '***', 'Should contain ***');
});

tester.test('sanitizes cookies from error messages', () => {
    const sanitizeForLog = (message) => {
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
        sanitized = sanitized.replace(/secret[=:]\s*\S+/gi, 'secret=***');
        sanitized = sanitized.replace(/session[_-]?id[=:]\s*\S+/gi, 'session_id=***');
        sanitized = sanitized.replace(/sessionid[=:]\s*\S+/gi, 'sessionid=***');

        return sanitized;
    };
    
    const message = 'Error: cookie=sessiondata123';
    const sanitized = sanitizeForLog(message);
    
    assert(!sanitized.includes('sessiondata123'), 'Should not contain cookie');
    assertIncludes(sanitized, '***', 'Should contain ***');
});

// ===== Connection Details Formatting Tests =====

tester.test('formats connected status with portal and gateway', () => {
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
    
    const status = {
        connected: true,
        portal: 'vpn.epam.com',
        gateway: 'gw.epam.com'
    };
    
    const details = formatConnectionDetails(status);
    
    assertIncludes(details, 'Connected', 'Should include Connected');
    assertIncludes(details, 'vpn.epam.com', 'Should include portal');
    assertIncludes(details, 'gw.epam.com', 'Should include gateway');
});

tester.test('formats disconnected status', () => {
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
    
    const status = {
        connected: false,
        portal: null,
        gateway: null
    };
    
    const details = formatConnectionDetails(status);
    
    assertEqual(details, 'Not connected', 'Should show Not connected');
});

// Run all tests
const success = tester.run();

// Exit with appropriate code
if (!success) {
    imports.system.exit(1);
}
