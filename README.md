<a target="_blank" href="https://chrome.google.com/webstore/detail/kiosk/afhcomalholahplbjhnmahkoekoijban">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this application from the Chrome Web Store")</a>

#Chrome Kiosk

Basic kiosk packaged application. Allows any URL to be loaded as a fullscreen kiosk in Google Chrome or Chrome OS, also disables device sleep mode while app is running.

##Known Limitations

- [Remote management is inaccessible on ChromeOS](https://github.com/zebradog/kiosk/issues/14)
- [Daily restart will only work on ChromeOS devices in Kiosk mode](https://developer.chrome.com/extensions/runtime#method-restart)

##Changelog
- v.5.3.0
    - updated to Materialize v0.95.1

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
