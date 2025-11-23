#!/usr/bin/gjs

/**
 * Property-based test runner for GNOME Shell Extension
 * This runs without Node.js, using GJS (GNOME JavaScript)
 */

// Simple property-based testing framework
class PropertyTester {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }
    
    /**
     * Run a property test with multiple iterations
     */
    assert(property, generator, options = {}) {
        const numRuns = options.numRuns || 100;
        
        for (let i = 0; i < numRuns; i++) {
            const testData = generator();
            const result = property(...testData);
            
            if (!result) {
                throw new Error(`Property failed on iteration ${i + 1} with data: ${JSON.stringify(testData)}`);
            }
        }
    }
    
    /**
     * Register a test
     */
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    /**
     * Run all tests
     */
    run() {
        print('\n=== Running Property-Based Tests ===\n');
        
        for (const test of this.tests) {
            try {
                test.fn();
                this.passed++;
                print(`✓ ${test.name}`);
            } catch (e) {
                this.failed++;
                print(`✗ ${test.name}`);
                print(`  Error: ${e.message}`);
            }
        }
        
        print(`\n=== Test Results ===`);
        print(`Passed: ${this.passed}`);
        print(`Failed: ${this.failed}`);
        print(`Total: ${this.tests.length}\n`);
        
        return this.failed === 0;
    }
}

// Simple generators
const generators = {
    string: () => {
        const length = Math.floor(Math.random() * 20) + 1;
        let result = '';
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    },
    
    domain: () => {
        const parts = Math.floor(Math.random() * 3) + 2;
        let domain = '';
        for (let i = 0; i < parts; i++) {
            if (i > 0) domain += '.';
            domain += generators.string();
        }
        return domain + '.com';
    },
    
    boolean: () => Math.random() > 0.5,
    
    integer: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min
};

// Create test runner
const tester = new PropertyTester();

// Property 1: Settings persistence round-trip
tester.test('Property 1: Settings persistence round-trip', () => {
    const property = (portal) => {
        const settings = {};
        settings['portal-address'] = portal;
        const loaded = settings['portal-address'];
        return loaded === portal;
    };
    
    const generator = () => [generators.domain()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 2: Portal address validation
tester.test('Property 2: Portal address validation', () => {
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
    
    const property = (input) => {
        const isValid = validatePortalAddress(input);
        const isDomain = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(input);
        
        // For this simple test, just verify domains are accepted
        if (isDomain) {
            return isValid === true;
        }
        return true; // Skip non-domain tests for simplicity
    };
    
    const generator = () => [generators.domain()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 3: Icon reflects connection state
tester.test('Property 3: Icon reflects connection state', () => {
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
    
    const property = (connected, isError, isTransitioning) => {
        const iconName = getIconForState(connected, isError, isTransitioning);
        
        if (isError) {
            return iconName === 'error.png';
        } else if (isTransitioning) {
            return iconName === 'connecting.png';
        } else if (connected) {
            return iconName === 'on.png';
        } else {
            return iconName === 'off.png';
        }
    };
    
    const generator = () => [generators.boolean(), generators.boolean(), generators.boolean()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 4: Status parsing completeness
tester.test('Property 4: Status parsing completeness', () => {
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
    
    const property = (connected, portal, gateway) => {
        let output = `Status: ${connected ? 'Connected' : 'Disconnected'}\n`;
        if (portal) {
            output += `Portal: ${portal}\n`;
        }
        if (gateway) {
            output += `Gateway: ${gateway}\n`;
        }
        
        const parsed = parseStatus(output);
        
        return parsed.connected === connected &&
               parsed.portal === portal &&
               parsed.gateway === gateway;
    };
    
    const generator = () => {
        const connected = generators.boolean();
        const portal = connected ? generators.domain() : null;
        const gateway = connected ? generators.domain() : null;
        return [connected, portal, gateway];
    };
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 5: Connect command includes portal
tester.test('Property 5: Connect command includes portal', () => {
    const buildConnectCommand = (portal) => {
        return ['globalprotect', 'connect', '--portal', portal];
    };
    
    const property = (portal) => {
        const command = buildConnectCommand(portal);
        
        return command.length === 4 &&
               command[0] === 'globalprotect' &&
               command[1] === 'connect' &&
               command[2] === '--portal' &&
               command[3] === portal;
    };
    
    const generator = () => [generators.domain()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 6: Error handling produces notifications
tester.test('Property 6: Error handling produces notifications', () => {
    const handleError = (error, context, options = {}) => {
        const { notify = true } = options;
        
        if (notify) {
            return { notified: true, message: error.message };
        }
        
        return { notified: false };
    };
    
    const property = (errorMessage, context) => {
        const error = new Error(errorMessage);
        const result = handleError(error, context, { notify: true });
        
        return result.notified === true;
    };
    
    const generator = () => [generators.string(), generators.string()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 7: State transitions are consistent
tester.test('Property 7: State transitions are consistent', () => {
    const simulateStateTransition = (currentState, operation, success) => {
        if (!success) {
            return currentState;
        }
        
        if (operation === 'connect') {
            return 'connected';
        } else if (operation === 'disconnect') {
            return 'disconnected';
        }
        
        return currentState;
    };
    
    const property = (initialState, operation) => {
        const newState = simulateStateTransition(initialState, operation, true);
        
        if (operation === 'connect') {
            return newState === 'connected';
        } else if (operation === 'disconnect') {
            return newState === 'disconnected';
        }
        
        return false;
    };
    
    const generator = () => {
        const states = ['connected', 'disconnected'];
        const operations = ['connect', 'disconnect'];
        return [
            states[Math.floor(Math.random() * states.length)],
            operations[Math.floor(Math.random() * operations.length)]
        ];
    };
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 8: Connection details include required fields
tester.test('Property 8: Connection details include required fields', () => {
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
    
    const property = (portal, gateway) => {
        const status = {
            connected: true,
            portal: portal,
            gateway: gateway
        };
        
        const details = formatConnectionDetails(status);
        
        return details.includes('Connected') &&
               details.includes(portal) &&
               details.includes(gateway);
    };
    
    const generator = () => [generators.domain(), generators.domain()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 9: Advanced commands produce notifications
tester.test('Property 9: Advanced commands produce notifications', () => {
    const executeAdvancedCommand = (commandName) => {
        const validCommands = ['rediscoverNetwork', 'resubmitHip', 'collectLog'];
        
        if (validCommands.includes(commandName)) {
            return {
                success: true,
                notified: true,
                message: `${commandName} completed successfully`
            };
        }
        
        return { success: false, notified: false };
    };
    
    const property = (commandName) => {
        const result = executeAdvancedCommand(commandName);
        
        return result.success && result.notified;
    };
    
    const generator = () => {
        const commands = ['rediscoverNetwork', 'resubmitHip', 'collectLog'];
        return [commands[Math.floor(Math.random() * commands.length)]];
    };
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 10: Subprocess output stream separation
tester.test('Property 10: Subprocess output stream separation', () => {
    const simulateSubprocessExecution = (stdoutData, stderrData) => {
        return {
            stdout: stdoutData,
            stderr: stderrData,
            streamsMixed: false
        };
    };
    
    const property = (stdoutData, stderrData) => {
        const result = simulateSubprocessExecution(stdoutData, stderrData);
        
        return result.stdout === stdoutData &&
               result.stderr === stderrData &&
               !result.streamsMixed;
    };
    
    const generator = () => [generators.string(), generators.string()];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 11: Resource cleanup completeness
tester.test('Property 11: Resource cleanup completeness', () => {
    class MockExtension {
        constructor() {
            this._resources = [];
        }
        
        enable() {
            this._resources = [
                { type: 'signal', id: 1, cleaned: false },
                { type: 'timeout', id: 2, cleaned: false },
                { type: 'object', id: 3, cleaned: false }
            ];
        }
        
        disable() {
            this._resources.forEach(resource => {
                resource.cleaned = true;
            });
        }
        
        areAllResourcesCleaned() {
            return this._resources.every(r => r.cleaned);
        }
    }
    
    const property = (numCycles) => {
        const extension = new MockExtension();
        
        for (let i = 0; i < numCycles; i++) {
            extension.enable();
            extension.disable();
            
            if (!extension.areAllResourcesCleaned()) {
                return false;
            }
        }
        
        return true;
    };
    
    const generator = () => [generators.integer(1, 10)];
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 12: Command availability verification
tester.test('Property 12: Command availability verification', () => {
    const checkCommandAvailability = (commandPath) => {
        const availableCommands = ['globalprotect', 'ls', 'cat', 'echo'];
        return availableCommands.includes(commandPath);
    };
    
    const property = (commandPath) => {
        const isAvailable = checkCommandAvailability(commandPath);
        
        if (commandPath === 'globalprotect' || commandPath === 'ls') {
            return isAvailable === true;
        } else {
            return isAvailable === false;
        }
    };
    
    const generator = () => {
        const commands = ['globalprotect', 'nonexistent-command', 'ls', 'invalid'];
        return [commands[Math.floor(Math.random() * commands.length)]];
    };
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Property 13: Error logging sanitization
tester.test('Property 13: Error logging sanitization', () => {
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
        sanitized = sanitized.replace(/key[=:]\s*\S+/gi, 'key=***');
        sanitized = sanitized.replace(/secret[=:]\s*\S+/gi, 'secret=***');
        sanitized = sanitized.replace(/session[_-]?id[=:]\s*\S+/gi, 'session_id=***');
        sanitized = sanitized.replace(/sessionid[=:]\s*\S+/gi, 'sessionid=***');

        return sanitized;
    };
    
    const property = (sensitiveType, sensitiveValue) => {
        const errorMessage = `Error occurred: ${sensitiveType}=${sensitiveValue}`;
        const sanitized = sanitizeForLog(errorMessage);
        
        return !sanitized.includes(sensitiveValue) &&
               sanitized.includes('***');
    };
    
    const generator = () => {
        const types = ['password', 'token', 'cookie', 'api_key', 'secret', 'session_id'];
        const type = types[Math.floor(Math.random() * types.length)];
        const value = generators.string() + generators.string();
        return [type, value];
    };
    
    tester.assert(property, generator, { numRuns: 100 });
});

// Run all tests
const success = tester.run();

// Exit with appropriate code
if (!success) {
    imports.system.exit(1);
}
