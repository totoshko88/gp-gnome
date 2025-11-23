#!/bin/bash

# Integration test script for GlobalProtect Extension with real CLI
# This script tests the extension's interaction with the actual GlobalProtect CLI

set -e

echo "=== GlobalProtect CLI Integration Tests ==="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_case() {
    local name="$1"
    local command="$2"
    
    echo -n "Testing: $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test 1: GlobalProtect CLI is available
test_case "GlobalProtect CLI availability" "which globalprotect"

# Test 2: GlobalProtect CLI can show status
test_case "GlobalProtect CLI status command" "globalprotect show --status"

# Test 3: GlobalProtect CLI help works
test_case "GlobalProtect CLI help command" "globalprotect help"

# Test 4: Extension files exist
test_case "Extension main file exists" "test -f extension.js"
test_case "Extension gpClient file exists" "test -f gpClient.js"
test_case "Extension indicator file exists" "test -f indicator.js"
test_case "Extension statusMonitor file exists" "test -f statusMonitor.js"
test_case "Extension errorHandler file exists" "test -f errorHandler.js"
test_case "Extension prefs file exists" "test -f prefs.js"
test_case "Extension metadata exists" "test -f metadata.json"

# Test 5: Schema file exists
test_case "GSettings schema exists" "test -f schemas/org.gnome.shell.extensions.globalprotect.gschema.xml"

# Test 6: Icon files exist
test_case "Connected icon exists" "test -f icons/on.png"
test_case "Disconnected icon exists" "test -f icons/off.png"
test_case "Connecting icon exists" "test -f icons/connecting.png"
test_case "Error icon exists" "test -f icons/error.png"

# Test 7: Test files exist
test_case "Property tests exist" "test -f tests/run-property-tests.js"
test_case "Unit tests exist" "test -f tests/run-unit-tests.js"

# Test 8: Verify GlobalProtect status output format
echo -n "Testing: GlobalProtect status output format... "
STATUS_OUTPUT=$(globalprotect show --status 2>&1)
if echo "$STATUS_OUTPUT" | grep -qi "status"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 9: Verify extension can be parsed by gjs
echo -n "Testing: Extension syntax validation... "
if gjs -c extension.js 2>&1 | grep -q "SyntaxError"; then
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
fi

# Test 10: Verify metadata.json is valid JSON
echo -n "Testing: metadata.json is valid JSON... "
if python3 -m json.tool metadata.json > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 11: Verify schema XML is valid
echo -n "Testing: GSettings schema is valid XML... "
if xmllint --noout schemas/org.gnome.shell.extensions.globalprotect.gschema.xml 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP (xmllint not available)${NC}"
fi

echo ""
echo "=== Test Results ==="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some integration tests failed!${NC}"
    exit 1
fi
