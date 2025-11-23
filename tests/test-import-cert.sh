#!/bin/bash

# Test script for Import Certificate dialog

echo "=========================================="
echo "Testing Import Certificate Dialog"
echo "=========================================="
echo ""

echo "Checking code..."
echo ""

# Check if dialog implementation exists
if grep -q "Import Certificate" indicator.js && grep -q "certPathEntry" indicator.js; then
    echo "✅ Import Certificate dialog implemented"
else
    echo "❌ Import Certificate dialog missing"
fi

# Check validation
if grep -q "query_exists" indicator.js; then
    echo "✅ File existence validation present"
else
    echo "❌ File existence validation missing"
fi

# Check extension validation
if grep -q "endsWith('.pem')" indicator.js; then
    echo "✅ File extension validation present"
else
    echo "❌ File extension validation missing"
fi

# Check gpClient method
if grep -q "async importCertificate" gpClient.js; then
    echo "✅ gpClient.importCertificate() method exists"
else
    echo "❌ gpClient.importCertificate() method missing"
fi

echo ""
echo "=========================================="
echo "Manual Testing:"
echo "=========================================="
echo ""
echo "Setup:"
echo "  # Create test certificate"
echo "  touch /tmp/test-cert.pem"
echo "  touch /tmp/test-cert.crt"
echo "  touch /tmp/test.txt"
echo ""
echo "Test 1: Valid .pem file"
echo "  1. Open Settings → Import Certificate"
echo "  2. Enter: /tmp/test-cert.pem"
echo "  3. Click Import"
echo "  4. Should show success notification"
echo ""
echo "Test 2: Valid .crt file"
echo "  1. Open Settings → Import Certificate"
echo "  2. Enter: /tmp/test-cert.crt"
echo "  3. Click Import"
echo "  4. Should show success notification"
echo ""
echo "Test 3: File not found"
echo "  1. Open Settings → Import Certificate"
echo "  2. Enter: /tmp/nonexistent.pem"
echo "  3. Click Import"
echo "  4. Should show: '❌ File not found: /tmp/nonexistent.pem'"
echo "  5. Should NOT close dialog"
echo ""
echo "Test 4: Empty path"
echo "  1. Open Settings → Import Certificate"
echo "  2. Leave field empty"
echo "  3. Click Import"
echo "  4. Should show: '⚠ Please enter a certificate path'"
echo "  5. Should NOT close dialog"
echo ""
echo "Test 5: Wrong extension"
echo "  1. Open Settings → Import Certificate"
echo "  2. Enter: /tmp/test.txt"
echo "  3. Click Import"
echo "  4. Should show warning (yellow)"
echo "  5. Should still allow import"
echo ""
echo "Test 6: Cancel"
echo "  1. Open Settings → Import Certificate"
echo "  2. Enter any path"
echo "  3. Click Cancel or press Escape"
echo "  4. Should close dialog without importing"
echo ""
echo "Test 7: Paste from clipboard"
echo "  1. Copy path: echo '/tmp/test-cert.pem' | xclip -selection clipboard"
echo "  2. Open Settings → Import Certificate"
echo "  3. Paste (Ctrl+V) into field"
echo "  4. Click Import"
echo "  5. Should work"
echo ""
echo "=========================================="
echo "Cleanup:"
echo "=========================================="
echo ""
echo "  rm /tmp/test-cert.pem /tmp/test-cert.crt /tmp/test.txt"
echo ""
echo "=========================================="

