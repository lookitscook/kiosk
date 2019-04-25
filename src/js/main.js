var FN_BASE_URL = 'https://us-central1-causal-shell-204520.cloudfunctions.net/';
var CHECK_IN_URL = FN_BASE_URL + 'check_in';
var REGISTER_DEVICE_URL = FN_BASE_URL + 'register_device';
var CHECK_IN_DUE = 1000 * 60 * 60 * 24 * 14; // check in due every 14 days, in ms

var directoryServer, adminServer, restartTimeout;
var data = {};

chrome.app.runtime.onLaunched.addListener(init);

chrome.commands.onCommand.addListener(function(command) {
  chrome.runtime.sendMessage(null, {
    'command': command
  });
});

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

function pollForCustomerConfigUpdate(cb) {
  getCustomerConfig(data.uuid, data.paired_user_configuration, function(err) {
    if (err) {
      console.error('Error getting customer config', err);
    }
    if (cb) {
      cb();
    }
    setTimeout(pollForCustomerConfigUpdate, 5 * 60 * 1000); //check in every 5 minutes
  });
}

function getCustomerConfig(deviceUuid, configId, cb) {
  if (!deviceUuid) {
    cb(new Error('Check in error: no device UUID'));
    return;
  }
  return postData(CHECK_IN_URL, {
    uuid: deviceUuid,
    configuration: configId
  }).then(function(res) {
    if (res && res.newConfig) {
      var newConfigId = res.newConfigId;
      var fields = Object.keys(res.newConfig);
      var newConfig = {};
      fields.forEach(function(field) {
        if (typeof res.newConfig[field].Value != "undefined") {
          newConfig[field] = res.newConfig[field].Value;
        }
      });
      Object.assign(data, newConfig, {
        paired_user_configuration: newConfigId,
      });
      return chrome.storage.local.set(data, cb);
    }
    return cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
}

function generateGuid() {
  var result, i, j;
  result = '';
  for (j = 0; j < 32; j++) {
    if (j == 8 || j == 12 || j == 16 || j == 20)
      result = result + '-';
    i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
    result = result + i;
  }
  return result;
}

function setStatus(status) {
  console.log('status: ', status);
  chrome.runtime.sendMessage(null, {
    'status': status
  });
}

function init() {

  async.series([
    function(next) {
      openWindow("windows/status.html", function() {
        setTimeout(next, 100);
      });
    },
    function(next) {
      setStatus('Getting prior configuration');
      chrome.storage.local.get(null, function(res) {
        data = res || {};
        setStatus('Prior configuration lookup complete');
        next();
      });
    },
    function(next) {
      if (data.uuid) {
        setStatus('Existing UUID found');
        return next();
      }
      setStatus('Generating UUID');
      data.uuid = generateGuid();
      chrome.storage.local.set({
        uuid: data.uuid,
      }, next);
    },
    function(next) {
      // check for a configured start up delay prior to making any external requests
      // delay is often used to allow wi-fi to initiate
      if (!data.startupdelay) {
        setStatus('No startup delay specified');
        return next();
      }
      setStatus('Delaying startup');
      var startupDelay = parseFloat(data.startupdelay) || 0;
      setTimeout(next, startupDelay * 1000);
    },
    function(next) {
      // get config from Kiosk Device Management Console
      if (!data.paired_user_id) {
        setStatus('Not paired with Kiosk Device Management Console');
        return next();
      }
      setStatus('Getting configuration from Kiosk Device Management Console');
      pollForCustomerConfigUpdate(next);
    },
    function(next) {
      // get config from Google Chrome Management Console
      if (!chrome.storage.managed) {
        setStatus('Not paired with Chrome Management Console');
        return next();
      }
      setStatus('Setting listener for managed configuration changes');
      chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'managed') {
          restart();
        }
      });
      setStatus('Getting configuration from Chrome Management Console');
      return chrome.storage.managed.get(null, function(managedConfig) {
        setStatus('Recieved response from Kiosk Device Management Console');
        if (managedConfig) {
          Object.assign(data, managedConfig);
          return chrome.storage.local.set(data, next);
        }
        return next();
      });
    },
    function(next) {
      // look up asset ID specific config, if any
      if (!chrome.enterprise || !chrome.enterprise.deviceAttributes || !data.devices || !data.devices.length) {
        setStatus('Skipping asset ID configuration lookup');
        return next();
      }
      setStatus('Fetching device asset ID');
      chrome.enterprise.deviceAttributes.getDeviceAssetId(function(assetID) {
        if (!assetID) {
          setStatus('Unable to acquire device asset ID');
          return next();
        }
        var deviceConfig = data.devices.find(function(config) {
          return assetID == config.assetid;
        });
        if (!deviceConfig) {
          setStatus('No asset ID specific configuration found');
          return next();
        }
        Object.assign(data, deviceConfig.configuration);
        setStatus('Applying asset ID configuration');
        return chrome.storage.local.set(data, next);
      });
    },
    function(next) {
      // look up UUID specific config, if any
      if (!data.devices || !data.devices.length) {
        setStatus('Skipping UUID configuration lookup');
        return next();
      }
      var deviceConfig = data.devices.find(function(config) {
        return data.uuid == config.uuid;
      });
      if (!deviceConfig) {
        setStatus('No UUID specific configuration found');
        return next();
      }
      Object.assign(data, deviceConfig.configuration);
      setStatus('Applying UUID configuration');
      return chrome.storage.local.set(data, next);
    }
  ], function(err) {

    setStatus('Configuration lookup complete');

    if (err) {
      console.error('startup error', err);
      setStatus('Startup error: ' + (err.toString ? err.toString() : '-'));
    }

    if (!('url' in data)) {
      if (('paired_user_id') in data) {
        // paired, just missing config
        setStatus('No configuration applied to this device.');
        return;
      }
      // need to set up
      setStatus('Initiating manual pairing');
      openWindow("windows/pair.html");
      return;
    }
    //setup has been completed

    // Sleepmode may not have been selected by user in setup because it
    // is a new config param, so assume the previous hard-coded value as
    // default.
    if (!data.sleepmode) {
      setStatus('Using default sleep mode');
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
    setStatus('Sleep mode configured');

    if (data.servelocaldirectory && data.servelocalhost && data.servelocalport) {
      setStatus('Starting local server');

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
        setStatus('Local server directory mounted');
        startWebserverDirectoryEntry(host, port, entry);
      });
    }

    setStatus('Opening browser window');
    openWindow("windows/browser.html");
  });

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

function openWindow(path, callback) {
  setStatus('Opening window');
  chrome.system.display.getInfo(function(display) {
    setStatus('System display info fetched');
    chrome.app.window.create(path, {
      'frame': 'none',
      'state': 'fullscreen',
      'bounds': {
        'left': 0,
        'top': 0,
        'width': display[0].bounds.width,
        'height': display[0].bounds.height
      }
    }, function(newWindow) {
      setStatus('New window created');
      var existingWindows = chrome.app.window.getAll();
      existingWindows.forEach(function(existingWindow) {
        if (existingWindow !== newWindow) {
          existingWindow.close();
        }
      });
      setStatus('Existing windows closed');
      if (newWindow) {
        newWindow.fullscreen();
        setTimeout(function() {
          if (newWindow) newWindow.fullscreen();
        }, 1000);
      }
      if (callback) {
        callback();
      }
    });
  });
}

function stopAutoRestart() {
  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }
}

function restart() {
  if (chrome.runtime.restart) chrome.runtime.restart(); // for ChromeOS devices in "kiosk" mode
  chrome.runtime.reload();
}

function postData(url, data) {
  return fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify(data),
  }).then(function(response) {
    return response.json();
  });
}