## Use

Build: `npm run build` then .zip the `/dist` folder for upload to the Chrome Developer Console.

## Changelog

- v7.0.1
  - Cache clearing update

- v7.0.0
  - BREAKING CHANGE: Removed support for F3 key content refresh
  - BREAKING CHANGE: Removed optional CTRL+I shortcut for viewing system information
  - Bug fix: shortcut key commands now work with all content

- v6.0.1
  - Bug fix: screensaver

- v6.0.0
  - BREAKING CHANGE: Removed support for remote admin
  - New feature: disable iframes
  - New feature: disable file upload fields
  - New feature: "disable" printing
  - New feature: open new windows in tabs
  - New feature: show battery status
  - Bug fix: console error
  - Bug fix: show multiple URL mode on edit

- v5.18.0
  - Migrate Free application version to Enterprise code base

- v5.17.1
  - Move startup delay earlier in process
  - Update export to work with current Chrome version

- v5.17.0
  - Add support for startup delay

- v5.16.0
  - Fix issue with save reloading
  - Add display system information option

-  v5.15.0
  - Added support for policies

- v5.14.1
  - Fix bug with keypresses not being recoginized (such as CTRL+A for opening local admin login).
  - updated icon

-  v5.14.0
  - Changed license from MIT to GPLv3. Going forward ya'll gotta share.

- v5.13.1
  - Bug fix: Remote admin page reloads correctly over slow connections

- v5.13.0
  - New feature: Restart can now be scheduled for specific days
  - Bug fix: Restart via Remote Admin now functional
  - Bug fix: Scheduled restart is no longer off by an hour

- v5.12.0
  - New feature: Navigation bar (home/back/refresh)
  - New feature: Screensaver
  - New feature: Hide Google Slides navigation (allowing Google Slides to be used for digital signage or screensaver)
  - New feature: Domain whitelist: prevent navigation to unspecified domains. 
  - Bug fix: Correct whitespace for pop-up windows
  - Bug fix: Correctly clear cache on inactivity

- v5.11.0
  - Reset content on F3 or CTRL+R
  - Optionally open print dialog on CTRL+P
  - Optionally clear cookies and cache on reset
  - Optionally override `Authorization` header
  - Fix bug with rendering remote admin, render index.html by default when serving local content.
  - Update internal web server to latest version

- v5.10.1
  - Auto-restart after 15 seconds if local file directory doesn't exist. For example, on some systems the app can start prior to external drives mounting after restart. This restart is canceled by pressing CTRL+A.

- v5.10.0
  - Fix UI bug requiring enter to be pressed after adding content URL (or a white screen was shown).
  - UI form improvements
  - Add option to rotate through content

- v5.9.3
  - Fix bug with legacy content loading

- v5.9.2
	- Fixed bug causing letterboxing on some displays

- v5.9.1
  - Scroll bar bug fix

- v5.9.0
  - Add support for tabs/multiple content URL
  - Update to Materialize 0.97.8

- v5.8.2
  - Open new windows in modal to allow closing

- v5.8.1
  - Allow new windows & prompt dialogs behind setting.   

- v5.8.0
  - Allow new windows
  - Added support for prompt dialogs
  - Remove demo link
  - Remove ZEBRADOG references

- v5.7.3
  - Bug fix: inactivity reset correctly detects input on touch screens
  - Bug fix: prevent content reload from throwing error

- v5.7.2
  - Allow simplified version of schedule JSON
  - Bug fix: load schedule JSON cross-domain
  - Bug fix: append time to schedule JSON to prevent caching

- v5.7.1
  - Bug fix: clear cache now fully clears cache

- v5.7.0
    - Sleep/screensaver mode configurable

- v5.6.0
  - Allow files to be served from local directory
  - Add option to clear cache on save
  - Add option to set custom user agent
  - Bug fix: Reload will now work correctly on all systems.

- v5.5.2
  - Bug fix: Correctly focus form-fields on load.
  - Bug fix: Save cookies, etc. across sessions.
  - Bug fix: 1:00 or 2:00 AM/PM restart time now loads correctly.
  - Change default remote management port to 8080 since 80 is blocked on ChromeOS.
  - Allow videos in content to go full screen.
  - Prevent exiting fullscreen by pressing escape

- v5.5.1
  - Bug fix: users on 5.4.0 with scheduling enabled experience rapid polling upon upgrade to 5.5.0.

- v5.5.0
  - Bug fix: switching scheduled content
  - Added ability to set schedule polling interval

- v5.4.0
    - Added remote schedule server support
    - Added option to hide cursor
    - Added option to disable context menu
    - Added option to disable image dragging
    - Added option to disable touch highlighting
    - Added option to disable text selection

- v5.3.4
    - Bug fix: restart scheduling

- v5.3.3
    - Bug fix: reset/restart combo.

- v.5.3.2
    - Optional webcam/mic access added.

- v5.3.1
    - Prevent inactivity reset via `console.log("kiosk:active")` in content page.

- v5.3.0
    - updated to Materialize v0.96.1
    - added local administration
    - added daily restart
    - added inactivity reset

- v5.2.1
	- auto-restart on content crash or unresponsive

- v5.2.0
	- added remote administration
	- remote restart for ChromeOS devices in kiosk mode
	- skinned with [Materialize](http://materializecss.com/)

- v5.1.2
	- automatically attempt to reconnect to content if connection broken

- v5.1.1
	- Bug fix: 1/5 screen fullscreen on Windows 8

- v5.1.0
	- started using proper semver
	- added demo link

- v5.0
	- added support for offline use

- v4.0
	- prevent system sleep	(previously only prevented display sleep)

- v3.0
	- cleaned up design files

- v2.0
	- added branding
	- cleaned up interface
	- switched to setup page from key-combo options page

- v1.0
	- initial draft version