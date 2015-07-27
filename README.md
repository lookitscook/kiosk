<a target="_blank" href="https://chrome.google.com/webstore/detail/kiosk/afhcomalholahplbjhnmahkoekoijban">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this application from the Chrome Web Store")</a>

#Chrome Kiosk

Basic kiosk packaged application. Allows any URL to be loaded as a fullscreen kiosk in Google Chrome or Chrome OS, also disables device sleep mode while app is running.

##Features

###System Adjustments
- Launches a specified URL full-screen at all times.
- Device power-saving (sleep mode) disabled
- Can be locked into-single app kiosk on managed Chrome devices.

###Local Administration

Setup can be accessed via keystroke (CTRL+A) and administer-configured username/password.

###Remote Administration

On desktop operating systems basic configuration as well as application restart options are available remotely. See "Known Limitations" for details on ChromeOS support.

###Inactivity Reset

Allow content to be reset after a administrator-specified period of inactivity.

###Daily restart

Application can be completely restarted at an administrator-specified time once per day.

###Remote Schedule Server

Accepts a URL to a JSON feed for a content schedule. If no item is currently scheduled, the default content (specified by the Content URL on Kiosk setup page) is used. Default content will be overridden by scheduled items. Schedule URL is polled every 15 minutes. Schedule should be formatted according to (a simplified version of) the format provided by [Chrome Sign Builder](https://chrome.google.com/webstore/detail/chrome-sign-builder/odjaaghiehpobimgdjjfofmablbaleem?hl=en) (exported schedules from Chrome Sign Builder are currently supported without support for screen position, repetition or display settings):
```
{
  "schedule": {
    "Value":  {
      "items": [
        {
          "content": "http://www.zebradog.com",
          "end": "Tue Jul 14 2015 12:30:00 GMT-0500",
          "start": "Tue Jul 14 2015 09:30:00 GMT-0500",
        },
        {
          "content": "http://www.google.com",
          "end": "Tue Jul 15 2015 12:30:00 GMT-0500",
          "start": "Tue Jul 16 2015 09:30:00 GMT-0500",
        }
      ]
    }
  }
}
```

##Support

This product is maintained by [ZEBRADOG](http://www.zebradog.com) and provided without warranty or guaranteed  support. If you need a bug fix please check that it has not be reported and submit details here: https://github.com/zebradog/kiosk/issues Patches and new features are released at our convenience. If you need a bug fix or new feature on a specific schedule, please send details to support@zebradog.com for a quote.

##Known Limitations

- [Remote management is inaccessible on ChromeOS.](https://github.com/zebradog/kiosk/issues/14)
- [Content URLs must be public. (http:// or https://)](https://github.com/zebradog/kiosk/issues/9)

##Changelog

-v5.4.0
    - Added remote schedule server support

- v5.3.4
    - Fixed bug with restart scheduling

- v.5.3.3
    - Fixed bug with reset/restart combo.

- v.5.3.2
    - Optional webcam/mic access added.

- v.5.3.1
    - Prevent inactivity reset via `console.log("kiosk:active")` in content page.

- v.5.3.0
    - updated to Materialize v0.96.1
    - added local administration
    - added daily restart
    - added inactivity reset

- v.5.2.1
	- auto-restart on content crash or unresponsive

- v.5.2.0
	- added remote administration
	- remote restart for ChromeOS devices in kiosk mode
	- skinned with [Materialize](http://materializecss.com/)

- v5.1.2
	- automatically attempt to reconnect to content if connection broken

- v5.1.1
	- fixed 1/5 screen fullscreen bug on Windows 8

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
