var LICENSED = true;

chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

var directoryServer, adminServer, restartTimeout;

function init() {

  var win, basePath, socketInfo;
  var data = {};
  var filesMap = {};

  /*
  LOG PERMISSION WARNINGS
  use to test manifest permissions changes
  DO NOT publish if new warnings are triggered. Prompt on existing
  installations would likely be a major issue.

  Current permission warnings are:
  -"Exchange data with any device on the local network or internet",
  -"Read folders that you open in the application"

  Should be commented out in production application.
  */
  /*chrome.management.getPermissionWarningsByManifest(
    JSON.stringify(chrome.runtime.getManifest()),
    function(warning){
      console.log("PERMISSION WARNINGS",warning);
    }
  );*/
  async.series([
    function(next) {
      if (!LICENSED) {
        next();
        return;
      }
      chrome.storage.managed.get(null, function(managedSettings) {
        // managed settings override local
        _.defaults(data, managedSettings);
        next();
      });
    },
    function(next) {
      chrome.storage.local.get(null, function(localSettings) {
        _.defaults(data, localSettings);
        next();
      });
    },
    function(next) {
      var startupDelay = parseFloat(data.startupdelay) || 0;
      setTimeout(next, startupDelay * 1000);
    }
  ], function(err) {

    if (('url' in data)) {
      //setup has been completed

      // Sleepmode may not have been selected by user in setup because it
      // is a new config param, so assume the previous hard-coded value as
      // default.
      if (!data.sleepmode) {
        chrome.storage.local.set({
          'sleepmode': 'display'
        });
        data.sleepmode = 'display';
      }
      if (data.sleepmode == 'none') {
        chrome.power.releaseKeepAwake();
      } else {
        chrome.power.requestKeepAwake(data.sleepmode);
      }

      if (data.servelocaldirectory && data.servelocalhost && data.servelocalport) {
        //serve files from local directory
        chrome.fileSystem.restoreEntry(data.servelocaldirectory, function(entry) {
          //if we can't get the directory (removed drive possibly)
          //wait 30 seconds and reload the app
          if (!entry) {
            restartTimeout = setTimeout(restart, 30 * 1000);
            return;
          }

          var host = data.servelocalhost;
          var port = data.servelocalport;
          startWebserverDirectoryEntry(host, port, entry);
        });
      }
      openWindow("windows/browser.html");
    } else {
      //need to run setup
      openWindow("windows/setup.html");
    }
  });

  function openWindow(path) {
    if (win) win.close();
    chrome.system.display.getInfo(function(d) {
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'browser',
        'state': 'fullscreen',
        'bounds': {
          'left': 0,
          'top': 0,
          'width': d[0].bounds.width,
          'height': d[0].bounds.height
        }
      }, function(w) {
        win = w;
        if (win) {
          win.fullscreen();
          setTimeout(function() {
            if (win) win.fullscreen();
          }, 1000);
        }
      });
    });
  }

  function startWebserverDirectoryEntry(host, port, entry) {
    directoryServer = new WSC.WebApplication({
      host: host,
      port: port,
      renderIndex: true,
      optRenderIndex: true,
      entry: entry
    });
    directoryServer.start();
  }

}

function stopAutoRestart() {
  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }
}