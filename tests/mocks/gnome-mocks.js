/**
 * Mock implementations of GNOME Shell APIs for testing
 * These mocks simulate the behavior of GLib, Gio, GObject, etc.
 */

// Mock GLib
export const GLib = {
    PRIORITY_DEFAULT: 0,
    SOURCE_CONTINUE: true,
    SOURCE_REMOVE: false,
    
    timeout_add: function(priority, interval, callback) {
        // Return a fake timeout ID
        return Math.floor(Math.random() * 10000);
    },
    
    timeout_add_seconds: function(priority, seconds, callback) {
        return Math.floor(Math.random() * 10000);
    },
    
    source_remove: function(id) {
        return true;
    },
    
    find_program_in_path: function(program) {
        // For testing, assume globalprotect is available
        if (program === 'globalprotect') {
            return '/usr/bin/globalprotect';
        }
        return null;
    }
};

// Mock Gio
export const Gio = {
    SubprocessFlags: {
        STDOUT_PIPE: 1,
        STDERR_PIPE: 2
    },
    
    Subprocess: class {
        constructor(params) {
            this.argv = params;
            this.flags = 0;
        }
        
        static new(argv, flags) {
            const proc = new Gio.Subprocess({ argv, flags });
            proc.flags = flags;
            return proc;
        }
        
        force_exit() {
            // Mock force exit
        }
        
        communicate_utf8_async(input, cancellable, callback) {
            // Simulate async communication
            setTimeout(() => {
                callback(this, {});
            }, 10);
        }
        
        communicate_utf8_finish(result) {
            // Return mock output
            return [true, 'Status: Disconnected\n', ''];
        }
        
        get_successful() {
            return true;
        }
    },
    
    File: {
        new_for_path: function(path) {
            return {
                query_exists: function() { return true; }
            };
        }
    },
    
    FileIcon: {
        new: function(file) {
            return {};
        }
    }
};

// Mock GObject
export const GObject = {
    TYPE_JSOBJECT: 'jsobject',
    
    Object: class {
        constructor() {
            this._signals = {};
        }
        
        connect(signal, callback) {
            if (!this._signals[signal]) {
                this._signals[signal] = [];
            }
            const id = Math.floor(Math.random() * 10000);
            this._signals[signal].push({ id, callback });
            return id;
        }
        
        disconnect(id) {
            for (const signal in this._signals) {
                this._signals[signal] = this._signals[signal].filter(s => s.id !== id);
            }
        }
        
        emit(signal, ...args) {
            if (this._signals[signal]) {
                this._signals[signal].forEach(s => s.callback(this, ...args));
            }
        }
    },
    
    registerClass: function(config, classDefinition) {
        return classDefinition;
    }
};

// Mock Settings
export class MockSettings {
    constructor() {
        this._data = {
            'portal-address': 'vpn.epam.com',
            'poll-interval': 5
        };
    }
    
    get_string(key) {
        return this._data[key] || '';
    }
    
    set_string(key, value) {
        this._data[key] = value;
    }
    
    get_int(key) {
        return this._data[key] || 0;
    }
    
    set_int(key, value) {
        this._data[key] = value;
    }
}

// Mock Main (for notifications)
export const Main = {
    notify: function(title, message) {
        // Mock notification
    },
    
    notifyError: function(title, message) {
        // Mock error notification
    }
};

// Global logError function
global.logError = function(error, context) {
    // Mock log error
    console.error(context, error);
};
