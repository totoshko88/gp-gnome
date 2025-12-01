#!/bin/bash

# GNOME Extension Review Guidelines Validation Script
# This script validates the extension against GNOME Extension Review Guidelines

echo "=== GNOME Extension Review Guidelines Validation ==="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo "✓ PASS: $1"
    ((PASSED++))
}

fail() {
    echo "✗ FAIL: $1"
    ((FAILED++))
}

warn() {
    echo "⚠ WARNING: $1"
    ((WARNINGS++))
}

info() {
    echo "ℹ INFO: $1"
}

echo "=== 1. Checking for Synchronous Blocking Operations ==="
echo ""

# Check for synchronous subprocess calls
if grep -r "Gio\.Subprocess\.new.*SYNC" *.js 2>/dev/null; then
    fail "Found synchronous subprocess calls (should use async)"
else
    pass "No synchronous subprocess calls found"
fi

# Check for synchronous file operations
if grep -r "\.load_contents\b" *.js 2>/dev/null | grep -v "async\|_async"; then
    warn "Found potentially synchronous file operations"
else
    pass "No synchronous file operations found"
fi

# Check for blocking sleep/wait calls
if grep -r "GLib\.usleep\|sleep\|wait" *.js 2>/dev/null; then
    warn "Found potential blocking sleep/wait calls"
else
    pass "No blocking sleep/wait calls found"
fi

echo ""
echo "=== 2. Checking Enable/Disable Lifecycle ==="
echo ""

# Check extension.js has enable() method
if grep -q "enable()" extension.js; then
    pass "enable() method found in extension.js"
else
    fail "enable() method not found in extension.js"
fi

# Check extension.js has disable() method
if grep -q "disable()" extension.js; then
    pass "disable() method found in extension.js"
else
    fail "disable() method not found in extension.js"
fi

# Check disable() cleans up resources
if grep -A 20 "disable()" extension.js | grep -q "stop\|destroy\|disconnect\|null"; then
    pass "disable() method appears to clean up resources"
else
    warn "disable() method may not properly clean up resources"
fi

# Check for proper signal disconnection
if grep -r "\.disconnect(" *.js 2>/dev/null | grep -q "signalId\|_signalIds\|Id"; then
    pass "Signal disconnection found in code"
else
    warn "No explicit signal disconnection found"
fi

# Check for timeout cleanup
if grep -r "GLib\.source_remove" *.js 2>/dev/null; then
    pass "Timeout cleanup (GLib.source_remove) found"
else
    warn "No timeout cleanup found"
fi

echo ""
echo "=== 3. Checking Import Restrictions ==="
echo ""

# Check extension.js doesn't import GTK
if grep -q "from 'gi://Gtk'" extension.js; then
    fail "extension.js imports GTK (not allowed)"
else
    pass "extension.js does not import GTK"
fi

if grep -q "from 'gi://Adw'" extension.js; then
    fail "extension.js imports Adw (not allowed)"
else
    pass "extension.js does not import Adw"
fi

# Check prefs.js doesn't import Shell
if grep -q "from 'resource:///org/gnome/shell" prefs.js; then
    fail "prefs.js imports Shell modules (not allowed)"
else
    pass "prefs.js does not import Shell modules"
fi

# Check prefs.js uses correct imports
if grep -q "from 'gi://Gtk'" prefs.js && grep -q "from 'gi://Adw'" prefs.js; then
    pass "prefs.js uses correct GTK/Adw imports"
else
    warn "prefs.js may not have correct imports"
fi

echo ""
echo "=== 4. Checking metadata.json ==="
echo ""

# Check metadata.json exists
if [ -f metadata.json ]; then
    pass "metadata.json exists"
    
    # Validate JSON syntax
    if python3 -m json.tool metadata.json > /dev/null 2>&1; then
        pass "metadata.json is valid JSON"
    else
        fail "metadata.json is not valid JSON"
    fi
    
    # Check required fields
    for field in uuid name description version shell-version; do
        if grep -q "\"$field\"" metadata.json; then
            pass "metadata.json contains required field: $field"
        else
            fail "metadata.json missing required field: $field"
        fi
    done
    
    # Check UUID format
    if grep -q "\"uuid\".*@" metadata.json; then
        pass "UUID contains @ symbol (correct format)"
    else
        fail "UUID should contain @ symbol"
    fi
    
else
    fail "metadata.json not found"
fi

echo ""
echo "=== 5. Checking GSettings Schema ==="
echo ""

# Check schema file exists
SCHEMA_FILE=$(find schemas -name "*.gschema.xml" -type f | head -n 1)
if [ -n "$SCHEMA_FILE" ] && [ -f "$SCHEMA_FILE" ]; then
    pass "GSettings schema file exists"
    
    # Check schema ID matches convention
    if grep -q "id=\"org.gnome.shell.extensions" "$SCHEMA_FILE"; then
        pass "Schema ID follows naming convention"
    else
        fail "Schema ID should start with org.gnome.shell.extensions"
    fi
    
    # Check schema has path
    if grep -q "path=\"/org/gnome/shell/extensions" "$SCHEMA_FILE"; then
        pass "Schema has correct path"
    else
        warn "Schema path may not follow convention"
    fi
    
    # Validate XML syntax (if xmllint available)
    if command -v xmllint > /dev/null 2>&1; then
        if xmllint --noout "$SCHEMA_FILE" 2>&1; then
            pass "Schema XML is valid"
        else
            fail "Schema XML is invalid"
        fi
    else
        info "xmllint not available, skipping XML validation"
    fi
    
else
    fail "GSettings schema file not found"
fi

echo ""
echo "=== 6. Checking Code Quality ==="
echo ""

# Check for console.log (should use log() or logError())
if grep -r "console\.log\|console\.error" *.js 2>/dev/null; then
    warn "Found console.log/error (should use log() or logError())"
else
    pass "No console.log/error found"
fi

# Check for proper error handling
if grep -r "try\s*{" *.js 2>/dev/null | wc -l | grep -q "[1-9]"; then
    pass "Error handling (try-catch) found in code"
else
    warn "Limited error handling found"
fi

# Check for async/await usage
if grep -r "async\s\+\w\+\s*(" *.js 2>/dev/null | wc -l | grep -q "[1-9]"; then
    pass "Async functions found in code"
else
    warn "No async functions found"
fi

# Check for proper Promise handling
if grep -r "\.then(\|\.catch(" *.js 2>/dev/null; then
    pass "Promise handling found in code"
else
    info "No explicit Promise handling found (may use async/await)"
fi

echo ""
echo "=== 7. Checking File Structure ==="
echo ""

# Check required files exist
for file in extension.js metadata.json; do
    if [ -f "$file" ]; then
        pass "Required file exists: $file"
    else
        fail "Required file missing: $file"
    fi
done

# Check for prefs.js if settings are used
if [ -f prefs.js ]; then
    pass "prefs.js exists (for settings UI)"
else
    info "prefs.js not found (no settings UI)"
fi

# Check for stylesheet
if [ -f stylesheet.css ]; then
    pass "stylesheet.css exists"
else
    info "stylesheet.css not found (no custom styling)"
fi

echo ""
echo "=== 8. Checking Resource Management ==="
echo ""

# Check for proper object destruction
if grep -r "destroy()" *.js 2>/dev/null | grep -v "^Binary"; then
    pass "destroy() methods found for cleanup"
else
    warn "No destroy() methods found"
fi

# Check for null assignments in cleanup
if grep -A 10 "disable()" extension.js | grep -q "= null"; then
    pass "Resources set to null in disable()"
else
    warn "Resources may not be properly nullified in disable()"
fi

# Check for signal tracking
if grep -r "_signalIds\|_signals\|signalId" *.js 2>/dev/null; then
    pass "Signal tracking found in code"
else
    warn "No signal tracking found (may lead to leaks)"
fi

echo ""
echo "=== 9. Checking Security ==="
echo ""

# Check for shell command injection risks
if grep -r "GLib\.spawn\|exec\|system(" *.js 2>/dev/null; then
    warn "Found potential shell command execution (check for injection risks)"
else
    pass "No direct shell command execution found"
fi

# Check subprocess uses array arguments (not shell strings)
if grep -r "Gio\.Subprocess\.new" *.js 2>/dev/null; then
    if grep -A 2 "Gio\.Subprocess\.new" *.js | grep -q "\[.*\]"; then
        pass "Subprocess uses array arguments (safe)"
    else
        warn "Subprocess may not use array arguments"
    fi
fi

# Check for sensitive data handling
if grep -r "password\|token\|secret" *.js 2>/dev/null | grep -v "sanitize\|replace"; then
    warn "Found references to sensitive data (ensure proper sanitization)"
else
    pass "No unsanitized sensitive data references found"
fi

echo ""
echo "=== 10. Checking Documentation ==="
echo ""

# Check for README
if [ -f README.md ] || [ -f README ]; then
    pass "README file exists"
else
    warn "README file not found"
fi

# Check for LICENSE
if [ -f LICENSE ] || [ -f COPYING ]; then
    pass "LICENSE file exists"
else
    warn "LICENSE file not found"
fi

# Check for code comments
if grep -r "^[[:space:]]*//\|^[[:space:]]*\*" *.js 2>/dev/null | wc -l | grep -q "[1-9][0-9]"; then
    pass "Code comments found"
else
    warn "Limited code comments found"
fi

echo ""
echo "=== Validation Summary ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Warnings: $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo "✓ Extension fully complies with GNOME Extension Review Guidelines"
        exit 0
    else
        echo "⚠ Extension mostly complies with guidelines, but has $WARNINGS warnings"
        exit 0
    fi
else
    echo "✗ Extension has $FAILED compliance issues that must be fixed"
    exit 1
fi
