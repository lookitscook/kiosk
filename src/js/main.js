var FN_BASE_URL = 'https://us-central1-causal-shell-204520.cloudfunctions.net/';
var CHECK_IN_URL = FN_BASE_URL + 'check_in';
var REGISTER_DEVICE_URL = FN_BASE_URL + 'register_device';
var CHECK_IN_DUE = 1000 * 60 * 60 * 24 * 14; // check in due every 14 days, in ms

chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

var licensed = false;
var directoryServer, adminServer, restartTimeout;
var uuid, customerId, customerConfigId, data;

chrome.commands.onCommand.addListener(function(command) {
  chrome.runtime.sendMessage(null, {
    'command': command
  }, function(response) {
    // console.log(response.status);
  });
});

function checkIn() {
  getCustomerConfig(function(err, response) {
    licensed = true;
    if (err) {
      console.error('check in error', err);
      if (checkInPastDue()) {
        licensed = false;
      }
    }
    if (response.newConfigId) {
      return chrome.storage.local.set({
        paired_user_configuration: response.newConfigId,
        customerConfig: response.newConfig
      }, restart);
    } else if (licensed !== data.licensed) {
      // it either became licensed or unlicensed
      return chrome.storage.local.set({
        licensed: licensed
      }, restart);
    }
    setTimeout(checkIn, 5 * 60 * 1000); //check in every 5 minutes
  });
}

function checkInPastDue() {
  if (!data || !data.last_successful_checkin || ((new Date) - data.last_successful_checkin) > CHECK_IN_DUE) {
    return true;
  }
  return false;
}

function getCustomerConfig(cb) {
  if (!uuid) {
    cb(new Error('Check in error: no device UUID'));
    return;
  }
  return postData(CHECK_IN_URL, {
    uuid: uuid,
    configuration: customerConfigId
  }).then(function(data) {
    var response = {};
    if (data) {
      response.newConfigId = data.newConfigId;
      if (data.newConfig) {
        var fields = Object.keys(data.newConfig);
        response.newConfig = {};
        fields.forEach(function(field) {
          if (typeof data.newConfig[field].Value != "undefined") {
            response.newConfig[field] = data.newConfig[field].Value;
          }
        });
      }
    }
    chrome.storage.local.set({
      last_successful_checkin: new Date(),
    }, function(err) {
      cb(err, response);
    });
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

function init() {

  var win;

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
      // get locally applied settings and other data
      chrome.storage.local.get(null, function(res) {
        localConfig = res || {};
        uuid = localConfig.uuid;
        customerId = localConfig.paired_user_id;
        customerConfigId = localConfig.paired_user_configuration;
        data = localConfig.deviceConfig || {};
        licensed = !!localConfig.licensed;
        next();
      });
    },
    function(next) {
      if (uuid) {
        return next();
      }
      uuid = generateGuid();
      chrome.storage.local.set({
        uuid: uuid,
      }, next);
    },
    function(next) {
      // check for a configured start up delay prior to making any external requests
      // delay is often used to allow wi-fi to initiate
      if (!data || !data.startupdelay) {
        next();
        return;
      }
      var startupDelay = parseFloat(data.startupdelay) || 0;
      setTimeout(next, startupDelay * 1000);
    },
    function(next) {
      // attempt to check in, if paired
      // will also set the customer config
      if (!customerId) {
        licensed = false;
        return next();
      }
      getCustomerConfig(function(err, response) {
        if (err) {
          console.log('unable to fetch customer config', err);
          if (checkInPastDue()) {
            licensed = false;
          }
          return next();
        }
        licensed = true;
        if (response.newConfigId) {
          return chrome.storage.local.set({
            paired_user_configuration: response.newConfigId,
            customerConfig: response.newConfig
          }, next);
        }
        return next();
      });
    },
    function(next) {
      // get config from chrome management console
      if (!licensed || !chrome.storage.managed) {
        return next();
      }
      return chrome.storage.managed.get(null, function(managedConfig) {
        chrome.storage.local.set({
          managedConfig: managedConfig
        }, next);
      });
    },
    function(next) {
      // merge the top level configs
      chrome.storage.local.get(null, function(local) {
        data = Object.assign({}, local, local.managedConfig, local.customerConfig);
        next();
      });
    },
    function(next) {
      // look up asset ID specific config, if any
      if (!licensed || !chrome.enterprise || !chrome.enterprise.deviceAttributes || !data.devices || !data.devices.length) {
        return next();
      }
      chrome.enterprise.deviceAttributes.getDeviceAssetId(function(assetID) {
        if (!assetID) {
          return next();
        }
        var deviceConfig = data.devices.find(function(config) {
          return assetID == config.assetid;
        });
        if (!deviceConfig) {
          return next();
        }
        Object.assign(data, deviceConfig.configuration);
        return next();
      });
    },
    function(next) {
      // look up UUID specific config, if any
      if (!licensed || !data.devices || !data.devices.length) {
        return next();
      }
      var deviceConfig = data.devices.find(function(config) {
        return uuid == config.uuid;
      });
      if (!deviceConfig) {
        return next();
      }
      Object.assign(data, deviceConfig.configuration);
      return next();
    },
    function(next) {
      chrome.storage.local.set({
        licensed: licensed,
        deviceConfig: data
      }, next)
    }
  ], function(err) {
    if (err) {
      console.error('startup error', err);
    }
    if ('openWindow' in data) {
      chrome.storage.local.remove('openWindow', function() {
        openWindow("windows/" + data.openWindow + ".html");
      });
      return;
    }

    if (!('url' in data)) {
      if (('paired_user_id') in data) {
        // paired, just missing config
        openWindow("windows/missing-config.html");
        return;
      }
      // need to set up
      openWindow("windows/pair.html");
      return;
    }
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

    // optionally disable accesibility features
    if (data.disableaccessibility) {
      if (!chrome.accessibilityFeatures) {
        console.error('Accesibility features are not available on this platform.');
      } else {
        [
          "spokenFeedback",
          "largeCursor",
          "stickyKeys",
          "highContrast",
          "screenMagnifier",
          "autoclick",
          "virtualKeyboard",
          /*"caretHighlight", // accessing these causes app to crash
          "cursorHighlight",
          "focusHighlight",
          "selectToSpeak",
          "switchAccess"*/
        ].forEach(function(prop) {
          if (!chrome.accessibilityFeatures[prop]) {
            return;
          }
          try {
            chrome.accessibilityFeatures[prop].set({
              value: false
            });
          } catch (err) {
            console.error(err);
          }
        });
      }
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
    if (customerId) {
      checkIn();
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