# Implementation Plan

- [x] 1. Set up project structure and metadata
  - Create extension directory structure with all required files
  - Write metadata.json with proper UUID, shell version, and description
  - Create GSettings schema XML file with portal-address and poll-interval keys
  - Set up basic stylesheet.css for UI styling
  - _Requirements: 10.1_

- [x] 2. Implement GlobalProtect CLI client wrapper
  - [x] 2.1 Create gpClient.js with GlobalProtectClient class
    - Implement async methods for all GlobalProtect commands using Gio.Subprocess
    - Add command availability check before execution
    - Implement proper timeout handling for each command type
    - Add stdout/stderr separation in subprocess output handling
    - _Requirements: 9.1, 9.2, 10.4_

  - [ ]* 2.2 Write property test for command availability verification
    - **Property 12: Command availability verification**
    - **Validates: Requirements 10.4**

  - [ ]* 2.3 Write property test for subprocess output stream separation
    - **Property 10: Subprocess output stream separation**
    - **Validates: Requirements 9.4**

  - [x] 2.4 Implement connect() method
    - Execute "globalprotect connect --portal <portal>" command
    - Handle MFA authentication flow (non-blocking)
    - Parse connection result and return status
    - _Requirements: 3.2, 8.1, 8.5_

  - [ ]* 2.5 Write property test for connect command portal parameter
    - **Property 5: Connect command includes portal**
    - **Validates: Requirements 3.2**

  - [x] 2.6 Implement disconnect() method
    - Execute "globalprotect disconnect" command
    - Handle disconnection errors
    - _Requirements: 4.2_

  - [x] 2.7 Implement getStatus() method
    - Execute "globalprotect show --status" command
    - Parse output into status object with connected, portal, gateway fields
    - Handle parsing errors gracefully
    - _Requirements: 2.3, 2.4_

  - [ ]* 2.8 Write property test for status parsing completeness
    - **Property 4: Status parsing completeness**
    - **Validates: Requirements 2.4**

  - [x] 2.9 Implement getDetails() method
    - Execute "globalprotect show --details" command
    - Parse detailed connection information
    - _Requirements: 5.2_

  - [x] 2.10 Implement advanced command methods
    - Add rediscoverNetwork() method
    - Add resubmitHip() method
    - Add collectLog() method with extended timeout
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ]* 2.11 Write unit tests for CLI client
    - Test command construction for all methods
    - Test error handling for command failures
    - Test timeout scenarios
    - Test output parsing edge cases (empty, malformed, missing fields)
    - _Requirements: 9.3_

- [x] 3. Implement status monitoring component
  - [x] 3.1 Create statusMonitor.js with StatusMonitor class
    - Extend GObject.Object with 'status-changed' signal
    - Implement start() method with GLib.timeout_add for polling
    - Implement stop() method with proper timeout cleanup
    - Add _poll() method that calls gpClient.getStatus()
    - Emit 'status-changed' signal only when status actually changes
    - _Requirements: 2.5_

  - [x] 3.2 Add configurable poll interval from settings
    - Read poll-interval from GSettings
    - Apply interval to timeout_add
    - _Requirements: 2.5_

  - [ ]* 3.3 Write unit tests for status monitor
    - Test polling mechanism
    - Test signal emission on status change
    - Test that signal is not emitted when status unchanged
    - Test cleanup in stop() method
    - _Requirements: 2.5_

- [x] 4. Implement settings and preferences UI
  - [x] 4.1 Create prefs.js with ExtensionPreferences class
    - Implement fillPreferencesWindow() method
    - Create Adw.PreferencesPage with connection settings group
    - Add Adw.EntryRow for portal address with default value
    - Connect entry changes to GSettings
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 4.2 Write property test for settings persistence
    - **Property 1: Settings persistence round-trip**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 4.3 Implement portal address validation
    - Add validation function for domain names and IP addresses
    - Show validation errors in preferences UI
    - Prevent saving invalid addresses
    - _Requirements: 1.4_

  - [ ]* 4.4 Write property test for portal address validation
    - **Property 2: Portal address validation**
    - **Validates: Requirements 1.4**

  - [ ]* 4.5 Write unit tests for preferences
    - Test default value loading
    - Test settings save/load
    - Test validation error display
    - _Requirements: 1.1, 1.5_

- [-] 5. Implement panel indicator UI
  - [x] 5.1 Create indicator.js with GlobalProtectIndicator class
    - Extend PanelMenu.Button
    - Create St.Icon for status indicator using custom icon files
    - Initialize with disconnected icon from /home/totoshko88/Documents/gp-gnome/icons/off.png
    - Store references to gpClient, statusMonitor, settings
    - _Requirements: 2.1, 2.2, 7.1, 7.2_

  - [ ]* 5.2 Write property test for icon state correspondence
    - **Property 3: Icon reflects connection state**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 5.3 Build main menu structure
    - Add status label (non-reactive menu item)
    - Add separator
    - Add connect/disconnect toggle button
    - Add advanced submenu with rediscover, resubmit HIP, collect logs options
    - Add separator
    - Add settings button that opens preferences
    - _Requirements: 3.1, 4.1, 5.1, 6.1_

  - [x] 5.4 Implement status change handler
    - Connect to statusMonitor 'status-changed' signal
    - Update icon based on connection state
    - Update status label text with portal/gateway info
    - Update toggle button label (Connect/Disconnect)
    - _Requirements: 2.1, 2.2, 5.4_

  - [ ]* 5.5 Write property test for connection details display
    - **Property 8: Connection details include required fields**
    - **Validates: Requirements 5.4**

  - [x] 5.6 Implement connect/disconnect toggle handler
    - Check current connection state
    - Call gpClient.connect() or disconnect() accordingly
    - Show connecting/disconnecting state in UI
    - Display success notification
    - Handle errors and show error notifications
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.7 Write property test for state transitions
    - **Property 7: State transitions are consistent**
    - **Validates: Requirements 3.5, 4.5**

  - [x] 5.8 Implement advanced command handlers
    - Add handler for each advanced menu item
    - Execute corresponding gpClient method
    - Show notification with operation result
    - Handle errors with error notifications
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.9 Write property test for advanced command notifications
    - **Property 9: Advanced commands produce notifications**
    - **Validates: Requirements 6.5**

  - [x] 5.10 Implement proper cleanup in destroy()
    - Disconnect all signal handlers
    - Call parent destroy()
    - _Requirements: 10.3_

  - [ ]* 5.11 Write unit tests for indicator
    - Test menu structure creation
    - Test icon updates on status change
    - Test menu label updates
    - Test button click handlers
    - Test notification display
    - _Requirements: 3.1, 4.1, 5.1, 5.3, 5.5_

- [x] 6. Implement error handling system
  - [x] 6.1 Create error handler utility
    - Implement ErrorHandler class with static methods
    - Add handle() method that logs, notifies, and updates UI
    - Add _getUserMessage() method for user-friendly error messages
    - Add _sanitizeForLog() method to remove sensitive data
    - _Requirements: 9.3, 10.5_

  - [ ]* 6.2 Write property test for error notification
    - **Property 6: Error handling produces notifications**
    - **Validates: Requirements 3.4, 4.4, 9.3**

  - [ ]* 6.3 Write property test for error log sanitization
    - **Property 13: Error logging sanitization**
    - **Validates: Requirements 10.5**

  - [x] 6.4 Integrate error handler into all components
    - Wrap all async operations with try-catch
    - Call ErrorHandler.handle() for all errors
    - Ensure user-friendly error messages
    - _Requirements: 3.4, 4.4, 9.3_

  - [ ]* 6.5 Write unit tests for error handler
    - Test error message generation for different error types
    - Test sensitive data sanitization
    - Test notification display
    - _Requirements: 9.3, 10.5_

- [x] 7. Implement main extension class
  - [x] 7.1 Create extension.js with Extension class
    - Extend Extension from GNOME Shell
    - Initialize instance variables in constructor
    - _Requirements: 10.2_

  - [x] 7.2 Implement enable() method
    - Load GSettings
    - Create GlobalProtectClient instance
    - Create StatusMonitor instance
    - Create GlobalProtectIndicator instance
    - Add indicator to panel status area
    - Start status monitoring
    - _Requirements: 1.3, 2.5_

  - [x] 7.3 Implement disable() method
    - Stop status monitor
    - Destroy indicator
    - Clear all references
    - Ensure no resources leak
    - _Requirements: 10.3_

  - [ ]* 7.4 Write property test for resource cleanup
    - **Property 11: Resource cleanup completeness**
    - **Validates: Requirements 10.3**

  - [ ]* 7.5 Write unit tests for extension lifecycle
    - Test enable() creates all components
    - Test disable() cleans up all resources
    - Test multiple enable/disable cycles
    - _Requirements: 10.3_

- [x] 8. Add MFA authentication support
  - [x] 8.1 Ensure connect() method is non-blocking
    - Verify Gio.Subprocess doesn't block browser window
    - Add "Waiting for authentication" status during MFA
    - _Requirements: 8.1, 8.2, 8.5_

  - [x] 8.2 Handle MFA authentication states
    - Detect MFA in progress from CLI output
    - Update UI to show authentication waiting state
    - Handle MFA success and failure
    - Show appropriate notifications
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 8.3 Write unit tests for MFA handling
    - Test MFA detection from output
    - Test UI state during MFA
    - Test MFA success handling
    - Test MFA failure/timeout handling
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 9. Add styling and polish
  - [x] 9.1 Create stylesheet.css
    - Add styles for menu items
    - Add styles for status labels
    - Ensure consistent spacing and padding
    - Follow GNOME HIG guidelines
    - _Requirements: 7.4_

  - [x] 9.2 Use custom icons from specified paths
    - Load /home/totoshko88/Documents/gp-gnome/icons/on.png for connected state
    - Load /home/totoshko88/Documents/gp-gnome/icons/off.png for disconnected state
    - Load /home/totoshko88/Documents/gp-gnome/icons/connecting.png for connecting/disconnecting states
    - Load /home/totoshko88/Documents/gp-gnome/icons/error.png for error states
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.3 Implement GNOME notification system
    - Use Main.notify() for success messages
    - Use Main.notifyError() for error messages
    - Ensure notifications are not excessive
    - _Requirements: 7.5_

  - [ ]* 9.4 Write unit tests for UI styling
    - Test icon names for each state
    - Test notification calls
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [-] 10. Testing and validation
  - [x] 10.1 Run all property-based tests
    - Execute all 13 property tests with 100+ iterations each
    - Verify all properties pass
    - Fix any failing properties
    - _Requirements: All_

  - [x] 10.2 Run all unit tests
    - Execute complete unit test suite
    - Verify all tests pass
    - Achieve reasonable code coverage
    - _Requirements: All_

  - [x] 10.3 Manual testing with real GlobalProtect CLI
    - Test connection to vpn.epam.com
    - Test MFA authentication flow
    - Test disconnect functionality
    - Test status monitoring
    - Test all advanced commands
    - Test error scenarios
    - _Requirements: All_

  - [x] 10.4 Validate against GNOME Extension Review Guidelines
    - Verify no synchronous blocking operations
    - Verify proper enable/disable lifecycle
    - Verify no GTK imports in extension.js
    - Verify no Shell imports in prefs.js
    - Verify metadata.json is well-formed
    - Verify GSettings schema follows naming conventions
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 11. Documentation and packaging
  - [x] 11.1 Write README.md
    - Add installation instructions
    - Add usage guide
    - Add troubleshooting section
    - Add screenshots
    - Add requirements (GlobalProtect CLI must be installed)
    - _Requirements: All_

  - [x] 11.2 Create installation script
    - Add script to compile schemas
    - Add script to install extension
    - Add script to enable extension
    - _Requirements: All_

  - [x] 11.3 Prepare for distribution
    - Create GitHub repository
    - Tag version 1.0
    - Create release with installation instructions
    - Prepare for extensions.gnome.org submission
    - _Requirements: All_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
