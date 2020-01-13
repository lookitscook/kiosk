# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Seperate Changelog

### Changed
- Remove custom build of Materialize
- Simplify development and build process
- Dependency security updates
- Schema documentation

### Removed
- Setup navigation menu
- Seperate pairing and status page

## [9.2.0]
### Added
  - New feature: scheduled reset option

## [7.1.0]
### Added
  - New feature: re-enable modal pop-ups
  - New feature: support Confirm and Prompt dialogs.
  - New feature: screensaver warning notification
  - New feature: screensaver reload interval
  - New feature: configuration by asset ID
### Changed
  - Bug fix: clear cache on startup if inactivity reset is enabled

## [7.0.1]
### Changed
  - Cache clearing update

## [7.0.0]
### Removed
  - BREAKING CHANGE: Removed support for F3 key content refresh
  - BREAKING CHANGE: Removed optional CTRL+I shortcut for viewing system information
### Changed
  - Bug fix: shortcut key commands now work with all content

## [6.0.1]
### Changed
  - Bug fix: screensaver

## [6.0.0]
### Added
  - New feature: disable iframes
  - New feature: disable file upload fields
  - New feature: "disable" printing
  - New feature: open new windows in tabs
  - New feature: show battery status
### Removed
  - BREAKING CHANGE: Removed support for remote admin
### Changed
  - Bug fix: console error
  - Bug fix: show multiple URL mode on edit

## [5.18.0]
### Changed
  - Migrate Free application version to Enterprise code base

## [5.17.1]
### Changed
  - Move startup delay earlier in process
  - Update export to work with current Chrome version

## [5.17.0]
### Added
  - Add support for startup delay

## [5.16.0]
### Added
  - Add display system information option
### Changed
  - Fix issue with save reloading

## [5.15.0]
### Added
  - Added support for policies

## [5.14.1]
### Changed
  - Fix bug with keypresses not being recoginized (such as CTRL+A for opening local admin login).
  - updated icon

## [5.14.0]
### Changed
  - Changed license from MIT to GPLv3. Going forward ya'll gotta share.

## [5.13.1]
### Changed
  - Bug fix: Remote admin page reloads correctly over slow connections

## [5.13.0]
### Added
  - New feature: Restart can now be scheduled for specific days
### Changed
  - Bug fix: Restart via Remote Admin now functional
  - Bug fix: Scheduled restart is no longer off by an hour

## [5.12.0]
### Added
  - New feature: Navigation bar (home/back/refresh)
  - New feature: Screensaver
  - New feature: Hide Google Slides navigation (allowing Google Slides to be used for digital signage or screensaver)
  - New feature: Domain whitelist: prevent navigation to unspecified domains. 
### Changed
  - Bug fix: Correct whitespace for pop-up windows
  - Bug fix: Correctly clear cache on inactivity

## [5.11.0]
### Added
  - Reset content on F3 or CTRL+R
  - Optionally open print dialog on CTRL+P
  - Optionally clear cookies and cache on reset
  - Optionally override `Authorization` header
### Changed
  - Fix bug with rendering remote admin, render index.html by default when serving local content.
  - Update internal web server to latest version

## [5.10.1]
### Changed
  - Auto-restart after 15 seconds if local file directory doesn't exist. For example, on some systems the app can start prior to external drives mounting after restart. This restart is canceled by pressing CTRL+A.

## [5.10.0]
### Added
  - Add option to rotate through content
### Changed
  - Fix UI bug requiring enter to be pressed after adding content URL (or a white screen was shown).
  - UI form improvements

## [5.9.3]
### Changed
  - Fix bug with legacy content loading

## [5.9.2]
### Changed
	- Fixed bug causing letterboxing on some displays

## [5.9.1]
### Changed
  - Scroll bar bug fix

## [5.9.0]
### Added
  - Add support for tabs/multiple content URL
### Changed
  - Update to Materialize 0.97.8

## [5.8.2]
### Changed
  - Open new windows in modal to allow closing

## [5.8.1]
### Added
  - Allow new windows & prompt dialogs behind setting.   

## [5.8.0]
### Added
  - Allow new windows
  - Added support for prompt dialogs
### Changed
  - Remove demo link
  - Remove ZEBRADOG references

## [5.7.3]
### Changed
  - Bug fix: inactivity reset correctly detects input on touch screens
  - Bug fix: prevent content reload from throwing error

## [5.7.2]
### Added
  - Allow simplified version of schedule JSON
### Changed
  - Bug fix: load schedule JSON cross-domain
  - Bug fix: append time to schedule JSON to prevent caching

## [5.7.1]
### Changed
  - Bug fix: clear cache now fully clears cache

## [5.7.0]
### Added
    - Sleep/screensaver mode configurable

## [5.6.0]
### Added
  - Allow files to be served from local directory
  - Add option to clear cache on save
  - Add option to set custom user agent
### Changed
  - Bug fix: Reload will now work correctly on all systems.

## [5.5.2]
### Changed
  - Bug fix: Correctly focus form-fields on load.
  - Bug fix: Save cookies, etc. across sessions.
  - Bug fix: 1:00 or 2:00 AM/PM restart time now loads correctly.
  - Change default remote management port to 8080 since 80 is blocked on ChromeOS.
  - Allow videos in content to go full screen.
  - Prevent exiting fullscreen by pressing escape

## [5.5.1]
### Changed
  - Bug fix: users on 5.4.0 with scheduling enabled experience rapid polling upon upgrade to 5.5.0.

## [5.5.0]
### Added
  - Added ability to set schedule polling interval
### Changed
  - Bug fix: switching scheduled content

## [5.4.0]
### Added
    - Added remote schedule server support
    - Added option to hide cursor
    - Added option to disable context menu
    - Added option to disable image dragging
    - Added option to disable touch highlighting
    - Added option to disable text selection

## [5.3.4]
### Changed
    - Bug fix: restart scheduling

## [5.3.3]
## Changed
    - Bug fix: reset/restart combo.

## [.5.3.2]
### Added
    - Optional webcam/mic access added.

## [5.3.1]
## Added
    - Prevent inactivity reset via `console.log("kiosk:active")` in content page.

## [5.3.0]
### Added
    - added local administration
    - added daily restart
    - added inactivity reset
## Changed
    - updated to Materialize v0.96.1

## [5.2.1]
## Added
	- auto-restart on content crash or unresponsive

## [5.2.0]
### Added
	- added remote administration
	- remote restart for ChromeOS devices in kiosk mode
### Changed
	- skinned with [Materialize](http://materializecss.com/)

## [5.1.2]
## Added
	- automatically attempt to reconnect to content if connection broken

## [5.1.1]
### Changed
	- Bug fix: 1/5 screen fullscreen on Windows 8

## [5.1.0]
# Added
	- started using proper semver
	- added demo link

## [5.0]
### Added
	- added support for offline use

## [4.0]
### Changed
	- prevent system sleep	(previously only prevented display sleep)

## [3.0]
### Changed
	- cleaned up design files

## [2.0]
### Added
	- added branding
### Changed
	- cleaned up interface
	- switched to setup page from key-combo options page

## [1.0]
### Added
	- initial draft version