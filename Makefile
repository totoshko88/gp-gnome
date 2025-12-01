# Makefile for gp-gnome - GNOME Shell Extension for GlobalProtect VPN

EXTENSION_UUID = gp-gnome@totoshko88.github.io
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)
BUILD_DIR = build
DIST_DIR = dist

# Extension files
EXTENSION_FILES = extension.js prefs.js indicator.js gpClient.js statusMonitor.js errorHandler.js metadata.json stylesheet.css
SCHEMA_FILES = schemas/org.gnome.shell.extensions.gp-gnome.gschema.xml
ICON_FILES = icons/*.svg

.PHONY: all install uninstall clean dist package test help

all: help

help:
	@echo "gp-gnome - GNOME Shell Extension for GlobalProtect VPN"
	@echo "Build Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  install     - Install extension to user directory"
	@echo "  uninstall   - Remove extension from user directory"
	@echo "  dist        - Create distribution package"
	@echo "  package     - Alias for dist"
	@echo "  test        - Run all tests"
	@echo "  test-unit   - Run unit tests"
	@echo "  test-props  - Run property-based tests"
	@echo "  clean       - Remove build artifacts"
	@echo "  help        - Show this help message"

install:
	@echo "Installing gp-gnome extension..."
	@mkdir -p $(INSTALL_DIR)
	@mkdir -p $(INSTALL_DIR)/schemas
	@mkdir -p $(INSTALL_DIR)/icons
	@cp $(EXTENSION_FILES) $(INSTALL_DIR)/
	@cp $(SCHEMA_FILES) $(INSTALL_DIR)/schemas/
	@cp $(ICON_FILES) $(INSTALL_DIR)/icons/
	@glib-compile-schemas $(INSTALL_DIR)/schemas/
	@echo "Extension installed to $(INSTALL_DIR)"
	@echo ""
	@echo "To enable the extension, run:"
	@echo "  gnome-extensions enable $(EXTENSION_UUID)"
	@echo ""
	@echo "Then restart GNOME Shell:"
	@echo "  - X11: Press Alt+F2, type 'r', press Enter"
	@echo "  - Wayland: Log out and log back in"

uninstall:
	@echo "Uninstalling gp-gnome extension..."
	@if gnome-extensions list --enabled | grep -q $(EXTENSION_UUID); then \
		gnome-extensions disable $(EXTENSION_UUID); \
		echo "Extension disabled"; \
	fi
	@rm -rf $(INSTALL_DIR)
	@echo "Extension uninstalled"

dist: clean
	@echo "Creating distribution package..."
	@mkdir -p $(DIST_DIR)
	@mkdir -p $(BUILD_DIR)
	@mkdir -p $(BUILD_DIR)/schemas
	@mkdir -p $(BUILD_DIR)/icons
	@cp $(EXTENSION_FILES) $(BUILD_DIR)/
	@cp LICENSE $(BUILD_DIR)/
	@cp $(SCHEMA_FILES) $(BUILD_DIR)/schemas/
	@cp $(ICON_FILES) $(BUILD_DIR)/icons/
	@cd $(BUILD_DIR) && zip -r ../$(DIST_DIR)/$(EXTENSION_UUID).zip .
	@echo "Distribution package created: $(DIST_DIR)/$(EXTENSION_UUID).zip"
	@echo "Note: gschemas.compiled will be generated during installation"

package: dist

test: test-unit test-props

test-unit:
	@echo "Running unit tests..."
	@gjs tests/run-unit-tests.js

test-props:
	@echo "Running property-based tests..."
	@gjs tests/run-property-tests.js

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR) $(DIST_DIR)
	@echo "Clean complete"

.SILENT: install uninstall dist clean
