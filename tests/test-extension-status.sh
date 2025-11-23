#!/bin/bash

echo "=== GlobalProtect Extension Status ==="
echo ""

echo "Extension info:"
gnome-extensions info globalprotect@username.github.io | grep -E "Увімкнено|Стан|Enabled|State"
echo ""

echo "Recent GNOME Shell logs (last 2 minutes):"
journalctl -b 0 /usr/bin/gnome-shell --since "2 minutes ago" --no-pager | grep -i "globalprotect\|error\|warning" | tail -20
echo ""

echo "Extension files:"
ls -lh ~/.local/share/gnome-shell/extensions/globalprotect@username.github.io/*.js
echo ""

echo "To see if indicator is in panel, check your system tray for GlobalProtect icon"
echo "If not visible, check logs with:"
echo "  journalctl -b 0 /usr/bin/gnome-shell --since '1 minute ago' --no-pager | grep -i globalprotect"
