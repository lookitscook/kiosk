
$(function() {

  var RESTART_DELAY = 1000;
  var CHECK_SCHEDULE_DELAY = 30 * 1000; //check content against schedule every 30 seconds
  var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes
  var DEFAULT_ROTATE_RATE = 30; //seconds
  var ACTIVE_EVENTS = "click mousedown mouseup mousemove touch touchstart touchend keypress keydown";

  var uuid;
  var restarting = false;
  var reset = false;
  var scheduledReset = false;
  var useScreensaver, screensaverTime, screensaverURL, screensaverWarningTime, screensaverWarningMessage, screensaverWarningTimeRemaining, screensaverReloadIntervalTime, screensaverReloadInterval;
  var scheduledResetInterval, resetTimeout, screensaverTimeout, screensaverWarningInterval;
  var restart;
  var urlrotateindex = 0;
  var rotaterate;
  var whitelist;
  var schedule, scheduleURL, contentURL, defaultURL, currentURL, schedulepollinterval;
  var hidegslidescontrols = false;
  var hidecursor = false;
  var disablecontextmenu = false;
  var disabledrag = false;
  var disabletouchhighlight = false;
  var disableselection = false;
  var useragent = '';
  var authorization = '';
  var resetcache = false;
  var clearcookies = false;
  var allowPrint = false;
  var allowDownload = false;
  var disallowUpload = false;
  var disallowIframes = false;
  var localAdmin = false;
  var showNav = false;
  var showBattery = false;
  var showTopBar = false;
  var tokens = {};
  var allowNewWindow, newWindowMode;

  setStatus('beginning initializing...');

  init();

  function setStatus(status) {
    console.log('status: ', status);
    $('#status').text(status);
  }

  function tokenizeUrl(url) {
    var findTokens = /{([^}]+)}/g;
    var tokenizedUrl = url;
    while (currentMatch = findTokens.exec(url)) {
      var token = currentMatch[1];
      var value = _.get(tokens, token);
      if (value) {
        tokenizedUrl = tokenizedUrl.replace(new RegExp('{' + token + '}', 'g'), value);
      }
    }
    return tokenizedUrl;
  }

  function showSystemInformation(duration) {
    Materialize.toast('UUID: ' + uuid + '<br>Content: ' + contentURL.join(','), duration);
  }

  function rotateURL() {
    if (contentURL.length > 1) {
      if (urlrotateindex < (contentURL.length - 1)) {
        urlrotateindex++;
      } else {
        urlrotateindex = 0;
      }
      currentURL = contentURL[urlrotateindex];
      $("#browser").remove();
      loadContent(false);
    }
  }

  function updateSchedule() {
    $.getJSON(scheduleURL, function(s) {
      if (s && s.length && !s.schedule) {
        var temp = s;
        s = {
          'schedule': {
            'Value': {
              'items': temp
            }
          }
        };
      }
      if (s && s.schedule && s.schedule.Value && s.schedule.Value.length) {
        //support schedule.Value as structure or array containing structure
        s.schedule.Value = s.schedule.Value[0];
      }
      if (s && s.schedule && s.schedule.Value && s.schedule.Value.items && s.schedule.Value.items.length) {
        s = s.schedule.Value.items;
        for (var i = 0; i < s.length; i++) {
          if (s[i].content && s[i].start && s[i].end) {
            s[i].start = new Date(Date.parse(s[i].start));
            s[i].end = new Date(Date.parse(s[i].end));
            s[i].duration = (s[i].end - s[i].start) / 1000; //duration is in seconds
          } else {
            //item did not include start, end, or content: invalid
            s = s.splice(i--, 1);
          }
        }
        schedule = s;
        checkSchedule();
      }
    });
  }

  function checkSchedule() {
    var s = schedule;
    var scheduledContent = [];
    if (s && s.length) {
      var now = Date.now();
      var hasScheduledContent = false;
      for (var i = 0; i < s.length; i++) {
        if (now >= s[i].start && now < s[i].end) {
          scheduledContent.push(s[i]);
        }
      }

      if (scheduledContent.length) {
        //find the latest start time
        scheduledContent.sort(function(a, b) {
          if (a.start == b.start) return a;
          return b.start - a.start;
        });

        //first in the list has the latest start time
        //only on a change do we want to load
        if (scheduledContent[0].content && !hasURL(scheduledContent[0].content)) {
          currentURL = scheduledContent[0].content.length ? scheduledContent[0].content : [scheduledContent[0].content];
          loadContent(false);
        }
      } else if (currentURL != defaultURL) {
        currentURL = defaultURL;
        loadContent(false);
      }
    }
  }

  function restartApplication() {
    if (chrome.runtime.restart) chrome.runtime.restart(); // for ChromeOS devices in "kiosk" mode
    chrome.runtime.reload();
  }

  function initEventHandlers() {
    //prevent existing fullscreen on escape key press
    window.onkeydown = window.onkeyup = function(e) {
      if (e.keyCode == 27) {
        e.preventDefault();
      }
    };

    window.oncontextmenu = function() {
      return false;
    };
    window.ondragstart = function() {
      return false;
    };

    $('#nav .home').click(function(e) {
      if ($('#nav .home').hasClass('inactive')) {
        return;
      }
      var activeBrowserID = $('#tabs a.active').attr('href');
      var $webview = $(activeBrowserID + ' webview');
      var activeHomeURL = $webview.data('src');
      $webview.attr('src', activeHomeURL);
    });

    $('#nav .back').click(function(e) {
      if ($('#nav .back').hasClass('inactive')) {
        return;
      }
      var activeBrowserID = $('#tabs a.active').attr('href');
      var $webview = $(activeBrowserID + ' webview');
      $webview.get(0).back();
    });

    $('#nav .refresh').click(function(e) {
      if ($('#nav .refresh').hasClass('inactive')) {
        return;
      }
      var activeBrowserID = $('#tabs a.active').attr('href');
      var $webview = $(activeBrowserID + ' webview');
      $webview.attr('src', $webview.attr('src'));
    });
  }

  function initModals() {
    $('.modal').modal();
  }

  function updateBatteryUI(battery) {
    var text = Math.floor(battery.level * 100) + '%';
    var icon = 'battery_';
    if (battery.charging) {
      icon += 'charging_'
    }
    var level = Math.ceil(battery.level * 10) * 10;
    if (level = 100) {
      icon += 'full';
    } else if (level === 40) {
      if (battery.level >= 0.375) {
        icon += '50';
      } else {
        icon += '30';
      }
    } else if (level === 70) {
      if (battery.level >= 0.675) {
        icon += '80';
      } else {
        icon += '50';
      }
    } else if (level < 10) {
      if (battery.charging) {
        icon += '20'
      } else {
        icon += 'alert'
      }
    } else {
      icon += level;
    }
    $('#battery-status .text').text(text);
    $('#battery-status i').text(icon);
  }

  function monitorBattery(battery) {
    // Update the initial UI.
    updateBatteryUI(battery);

    // Monitor for futher updates.
    battery.addEventListener('levelchange',
      updateBatteryUI.bind(null, battery));
    battery.addEventListener('chargingchange',
      updateBatteryUI.bind(null, battery));
    battery.addEventListener('dischargingtimechange',
      updateBatteryUI.bind(null, battery));
    battery.addEventListener('chargingtimechange',
      updateBatteryUI.bind(null, battery));
  }

  chrome.commands.onCommand.addListener(function(command) {
    switch (command) {
      case "openAdmin":
        // open admin login on ctrl+a
        if (localAdmin) {
          chrome.runtime.getBackgroundPage(function(backgroundPage) {
            backgroundPage.stopAutoRestart();
            $('#login').modal('open');
            $('#username').focus();
            $('#passwordLabel').addClass('active');
          });
        }
        break;
      case "refresh":
        // refresh on ctrl+r
        loadContent(true);
        break;
      case "print":
        // print on ctrl+p
        if (allowPrint) {
          var activeBrowserID = $('#tabs a.active').attr('href');
          $(activeBrowserID + ' webview').get(0).print();
        }
        break;
      default:
    }
  });

  function init() {

    setStatus('loading local settings');
    chrome.storage.local.get(null, function(data) {
      setStatus('local settings loaded');

      uuid = data.uuid;

      initEventHandlers();
      setStatus('event handlers initialized');

      initModals();
      setStatus('dialogs initialized');

      //get tokens
      var useTokens = (Array.isArray(data.url) ? data.url : [data.url]).some(function(url) {
        return url.indexOf('{') >= 0 && url.indexOf('}') >= 0;
      });

      async.series([
        function(next) {
          setStatus('setting uuid token');
          if (!useTokens) {
            next();
            return;
          }
          tokens.uuid = data.uuid;
          next();
        },
        function(next) {
          setStatus('setting network tokens');
          if (!useTokens) {
            next();
            return;
          }
          setStatus('getting network interfaces');
          chrome.system.network.getNetworkInterfaces(function(interfaces) {
            interfaces.forEach(function(interface) {
              if (!interface.name || !interface.address) {
                console.error('Missing details for network interface:', interface);
                return;
              }
              _.set(tokens, interface.name.toLowerCase() + '.ipaddress.' + (interface.address.indexOf(':') >= 0 ? 'ipv6' : 'ipv4'), interface.address);
            });
            next();
          });
        },
        function(next) {
          setStatus('setting custom tokens');
          if (!useTokens || !data.customtoken) {
            next();
            return;
          }
          setStatus('parsing custom tokens');
          try {
            tokens = _.defaults(JSON.parse(data.customtoken), tokens);
          } catch (error) {
            console.error('Error parsing custom token json:', error);
          }
          next();
        },
        function(next) {
          setStatus('setting remote tokens');
          if (!useTokens || !data.tokenserver) {
            next();
            return;
          }
          setStatus('fetching remote tokens');
          $.getJSON(tokenizeUrl(data.tokenserver)).done(function(tokenServerTokens) {
            tokens = _.defaults(tokenServerTokens, tokens);
            next();
          }).fail(function(jqxhr, textStatus, error) {
            console.error('Error getting tokens from server:', error);
            next();
          });
        },
        function(next) {
          setStatus('resetting custom tokens');
          //do custom tokens twice to override tokenserver values
          if (!useTokens || !data.customtoken) {
            next();
            return;
          }
          try {
            tokens = _.defaults(JSON.parse(data.customtoken), tokens);
          } catch (error) {
            console.error('Error parsing custom token json:', error);
          }
          next();
        }
      ], function(err, res) {

        setStatus('processing settings');

        allowPrint = !!data.allowprint;
        allowDownload = !!data.allowdownload;
        disallowUpload = !!data.disallowupload;
        disallowIframes = !!data.disallowiframes;
        showNav = !!data.shownav;
        showBattery = !!data.showbattery;
        showTopBar = showNav || showBattery;

        if (showTopBar) {
          $('body').addClass('show-top-bar');
        }

        if (showBattery) {
          if ('getBattery' in navigator) {
            $('body').addClass('show-battery');
            navigator.getBattery().then(monitorBattery);
          } else {
            console.error('getBattery not found in navigator');
          }
        }

        if (showNav) {
          $('body').addClass('show-nav');
        }

        if (data.local) {
          localAdmin = true;

          var submitLoginForm = function submitLoginForm(e) {
            e.preventDefault();
            var username = $('#username').val();
            var password = $("#password").val();
            if (username == data.username && password == data.password) {
              $('#login').modal('close');
              $('#username').val('');
              $("#password").val('');
              chrome.runtime.getBackgroundPage(function(backgroundPage) {
                backgroundPage.openWindow("windows/setup.html");
              });
            } else {
              Materialize.toast('Invalid login.', 4000);
            }
          };

          // UX: Pressing enter within the username field will focus the password field
          $('#username').on('keydown', function(e) {
            if (e.which == 13 || e.key == 'Enter') {
              $('#password').focus();
            }
          });

          // UX: Pressing enter within the password field will submit the login form
          $('#password').on('keydown', function(e) {
            if (e.which == 13 || e.key == 'Enter') {
              submitLoginForm(e);
            }
          });

          $('#submit').on('click', submitLoginForm);
        }

        if (data.restart && parseInt(data.restart)) {
          var hour = parseInt(data.restart) - 1;
          var now = moment();
          restart = moment();
          if (data.restartday) {
            restart.day(data.restartday);
          }
          restart.hour(hour + 1).set({
            'minute': 0,
            'second': 0,
            'millisecond': 0
          });
          if (now.isAfter(restart)) {
            if (data.restartday) {
              restart.add(1, 'w'); //if we're past the time today, do it next week
            } else {
              restart.add(1, 'd'); //if we're past the time today, do it tomorrow
            }
          }
          setInterval(function() {
            var now = moment();
            if (now.isAfter(restart)) {
              restartApplication();
            }
          }, 60 * 1000);
        }
        if (data.remoteschedule && data.remotescheduleurl) {
          schedulepollinterval = data.schedulepollinterval ? data.schedulepollinterval : DEFAULT_SCHEDULE_POLL_INTERVAL;
          scheduleURL = tokenizeUrl(data.remotescheduleurl.indexOf('?') >= 0 ? data.remotescheduleurl + '&kiosk_t=' + Date.now() : data.remotescheduleurl + '?kiosk_t=' + Date.now());
          updateSchedule();
          setInterval(updateSchedule, schedulepollinterval * 60 * 1000);
          setInterval(checkSchedule, CHECK_SCHEDULE_DELAY);
        }

        hidegslidescontrols = data.hidegslidescontrols ? true : false;
        hidecursor = data.hidecursor ? true : false;
        disablecontextmenu = data.disablecontextmenu ? true : false;
        disabledrag = data.disabledrag ? true : false;
        disabletouchhighlight = data.disabletouchhighlight ? true : false;
        disableselection = data.disableselection ? true : false;
        resetcache = data.resetcache ? true : false;
        allowNewWindow = data.newwindow ? true : false;
        newWindowMode = data.newwindowmode;

        scheduledReset = data.scheduledreset && parseFloat(data.scheduledreset) > 0 ? parseFloat(data.scheduledreset) : false;
        reset = data.reset && parseFloat(data.reset) > 0 ? parseFloat(data.reset) : false;
        screensaverTime = data.screensavertime && parseFloat(data.screensavertime) > 0 ? parseFloat(data.screensavertime) : false;
        screensaverURL = tokenizeUrl(data.screensaverurl);
        useScreensaver = screensaverTime && screensaverURL ? true : false;
        screensaverWarningTime = (data.screensaverwarningtime && parseFloat(data.screensaverwarningtime)) || 0;
        screensaverWarningMessage = data.screensaverwarningmessage;
        screensaverReloadIntervalTime = parseFloat(data.screensaverreloadinterval) || 0;

        clearcookies = data.clearcookiesreset ? true : false;

        if (reset || useScreensaver) $('*').on(ACTIVE_EVENTS, active);

        defaultURL = contentURL = Array.isArray(data.url) ? data.url.map(function(url) {
          return tokenizeUrl(url);
        }) : [tokenizeUrl(data.url)];
        whitelist = Array.isArray(data.whitelist) ? data.whitelist : data.whitelist ? [data.whitelist] : [];
        useragent = data.useragent;
        authorization = data.authorization;
        if (data.multipleurlmode == 'rotate') {
          defaultURL = contentURL[urlrotateindex];
          rotaterate = data.rotaterate ? data.rotaterate : DEFAULT_ROTATE_RATE;
          setInterval(rotateURL, rotaterate * 1000);
        }
        currentURL = defaultURL;

        if (data.displaysysteminfo === 'always') {
          showSystemInformation();
        }

        setStatus('loading content');

        loadContent(true);
        if (resetcache || clearcookies) {
          setStatus('starting cache clear');
          $('#container').hide();
          setTimeout(function() {
            var restartApp = resetcache;
            setStatus('clearing cache');
            clearCache(function() {
              if (restartApp) {
                restartApplication();
              }
              $('#container').show();
            });
          }, 100);
        }

      });
    });

    window.addEventListener('message', function(e) {
      var data = e.data;
      if (data.command == 'title' && data.title && data.id) {
        $('#tabs .tab a[href="#' + data.id + '"] .title').text(data.title);
      }
    });
  }

  function hasURL(url) {
    if (Array.isArray(url)) {
      for (var i = 0; i < url.length; i++) {
        if (!currentURL.includes(url[i])) {
          return false;
        }
      }
      return true;
    }
    return currentURL.includes(url);
  }

  function active() {
    if ($('body').hasClass('screensaverActive')) {
      $('body').removeClass('screensaverActive');
      refreshContent(true);
    }
    if (resetTimeout) {
      clearTimeout(resetTimeout);
      resetTimeout = false;
    }
    if (screensaverTimeout) {
      clearTimeout(screensaverTimeout);
      screensaverTimeout = false;
    }
    $('#screensaverWarningModal').modal('close');
    if (screensaverWarningInterval) {
      clearInterval(screensaverWarningTimeRemaining);
      screensaverWarningInterval = false;
    }
    if (screensaverReloadInterval) {
      clearInterval(screensaverReloadInterval);
      screensaverReloadInterval = false;
    }
    startScreensaverTimeout();
    startResetTimeout();
  }

  function startScreensaverTimeout() {
    if (useScreensaver && !screensaverTimeout) {
      screensaverTimeout = setTimeout(function() {
        screensaverTimeout = setTimeout(function() {
          screensaverTimeout = false;
          $('#screensaverWarningModal').modal('close');
          if (screensaverWarningInterval) {
            clearInterval(screensaverWarningInterval);
            screensaverWarningInterval = false;
          }
          if ($('body').hasClass('screensaverActive')) {
            return;
          }
          if (screensaverReloadIntervalTime) {
            screensaverReloadInterval = setInterval(function() {
              refreshContent(true);
            }, screensaverReloadIntervalTime * 60 * 1000);
          }
          $('body').addClass('screensaverActive');
          if (clearcookies) {
            clearCache(function() {
              refreshContent(false);
            });
          } else {
            refreshContent(false);
          }
        }, screensaverWarningTime * 1000);
        if (screensaverWarningTime && screensaverWarningMessage) {
          screensaverWarningTimeRemaining = Math.ceil(screensaverWarningTime);
          $('#screensaverWarning').text(screensaverWarningMessage.replace(/\{countdown\}/g, screensaverWarningTimeRemaining));
          $('#screensaverWarningModal').modal('open');
          screensaverWarningInterval = setInterval(function() {
            screensaverWarningTimeRemaining--;
            if (screensaverWarningTimeRemaining < 0) {
              return;
            }
            $('#screensaverWarning').text(screensaverWarningMessage.replace(/\{countdown\}/g, screensaverWarningTimeRemaining));
          }, 1000);
        }
      }, screensaverTime * 60 * 1000);
    }
  }

  function startScheduledResetInterval() {
    if (scheduledReset) {
      if (scheduledResetInterval) {
        clearInterval(scheduledResetInterval);
      }
      scheduledResetInterval = setInterval(function() {
        if (clearcookies) {
          clearCache(function() {
            refreshContent(true); // screensaver 
            refreshContent(false); // content
          });
        } else {
          refreshContent(true);
          refreshContent(false);
        }
      }, scheduledReset * 60 * 1000);
    }
  }

  function startResetTimeout() {
    if (reset && !resetTimeout) {
      resetTimeout = setTimeout(function() {
        resetTimeout = false;
        if ($('body').hasClass('screensaverActive')) {
          return;
        }
        if (clearcookies) {
          clearCache(function() {
            refreshContent(false);
          });
        } else {
          refreshContent(false);
        }
      }, reset * 60 * 1000);
    }
  }

  function getDomainWhiteListError(url) {
    if (!whitelist || !whitelist.length) {
      return null;
    }

    var requestedURL = url.replace('https://', '').replace('http://', '');
    var requestedPath = requestedURL.split('/');
    var requestedDomain = requestedPath && requestedPath.length ? requestedPath[0] : requestedPath;

    for (var i = 0; i < whitelist.length; i++) {
      var allowedURL = whitelist[i].replace('https://', '').replace('http://', '');
      var allowedPath = allowedURL.split('/');
      if (allowedPath && allowedPath.length > 1) {
        //match the whole path
        if (requestedURL.indexOf(allowedURL) == 0) {
          return null;
        }
      } else {
        //match just the domain portion
        var allowedDomain = allowedPath && allowedPath.length ? allowedPath[0] : allowedPath;
        if (requestedDomain.indexOf(allowedDomain) >= 0) {
          return null;
        }
      }
    }

    return "Request to " + requestedDomain + " blocked.";
  }

  function setNavStatus() {
    var activeBrowserID = $('#tabs a.active').attr('href');
    var $webview = $(activeBrowserID + ' webview');
    var activeHomeURL = $webview.data('src');
    var currentURL = $webview.attr('src');
    if (currentURL == activeHomeURL) {
      $('#nav .home').addClass('inactive');
    } else {
      $('#nav .home').removeClass('inactive');
    }
    if ($webview.length && $webview.get(0).canGoBack()) {
      $('#nav .back').removeClass('inactive');
    } else {
      $('#nav .back').addClass('inactive');
    }
    setStatus('set nav status complete');
  }

  function initWebview($webview) {
    $webview.css({
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      })
      .attr('partition', 'persist:kiosk-afhcomalholahplbjhnmahkoekoijban')
      .on('exit', onEnded)
      .on('unresponsive', onEnded)
      .on('loadabort', function(e) {
        setStatus('load aborted');
        if (e.isTopLevel) onEnded(e);
      })
      .on('consolemessage', function(e) {
        if (e.originalEvent.message == 'kiosk:active') active();
        else if (e.originalEvent.message == 'kiosk:reset') {
          clearCache(function() {
            refreshContent(false);
          });
        };
      })
      .on('permissionrequest', function(e) {
        if (e.originalEvent.permission === 'media') {
          e.preventDefault();
          chrome.permissions.contains({
            permissions: ['audioCapture', 'videoCapture']
          }, function(result) {
            if (result) {
              // The app has the permissions.
              e.originalEvent.request.allow();
            } else {
              // The app doesn't have the permissions.
              // request it
              $('#mediaPermission .ok').click(function() {
                chrome.permissions.request({
                  permissions: ['audioCapture', 'videoCapture']
                }, function(granted) {
                  if (granted) e.originalEvent.request.allow();
                });
              });
              $('#mediaPermission').modal('open');
            }
          });
        } else if (e.originalEvent.permission === 'fullscreen') {
          e.originalEvent.request.allow();
        } else if (e.originalEvent.permission === 'download') {
          if (allowDownload) {
            e.originalEvent.request.allow();
          }
        }
      })
      .on('contentload', function(e) {
        setStatus('content loaded');
        var browser = e.target;
        browser.executeScript({
          code: "var kioskAppWindow = null;" +
            "var kioskAppOrigin = null;" +
            "window.addEventListener('message', function(e){" +
            "  if (!kioskAppWindow || !kioskAppOrigin) {" +
            "    kioskAppWindow = event.source;" +
            "    kioskAppOrigin = event.origin;" +
            "  }" +
            "  if(e.data.command == 'kioskGetTitle'){" +
            "    kioskAppWindow.postMessage({ command: 'title', title: document.title, id: e.data.id }, kioskAppOrigin);" +
            "  }" +
            "});"
        });
        setStatus('content script executed');
        browser.contentWindow.postMessage({
          command: 'kioskGetTitle',
          id: $webview.parent().attr('id')
        }, '*');
        setStatus('content message posted');

        if (hidegslidescontrols && browser.src.indexOf('https://docs.google.com/presentation') >= 0) {
          setStatus('apply google presentation settings');
          $webview.css({
            height: '99%',
            bottom: '1px'
          });
          browser.insertCSS({
            code: ".punch-viewer-nav-v2, .punch-viewer-nav-fixed{ display:none; visibility:hidden; }"
          });
          setTimeout(function() {
            setStatus('completing google presentation settings');
            $webview.css({
              height: '100%',
              bottom: 0,
            });
          }, 10);
        }
        if (!allowPrint) {
          browser.insertCSS({
            code: "@media print{ body {display:none;} }"
          });
        }
        if (disallowUpload) {
          browser.executeScript({
            code: "document.querySelectorAll('input[type=file]').forEach(function(f){ f.disabled = true });"
          });
        }
        if (hidecursor)
          browser.insertCSS({
            code: "*{cursor:none;}"
          });
        if (disablecontextmenu)
          browser.executeScript({
            code: "window.oncontextmenu = function(){return false};"
          });
        if (disabledrag)
          browser.executeScript({
            code: "window.ondragstart = function(){return false};"
          });
        if (disabletouchhighlight)
          browser.insertCSS({
            code: "*{-webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-touch-callout: none;}"
          });
        if (disableselection)
          browser.insertCSS({
            code: "*{-webkit-user-select: none; user-select: none;}"
          });
        setStatus('focusing on browser');
        browser.focus();
      })
      .on('loadstop', function(e) {
        if (disallowIframes) {
          setStatus('disallowing iframes');
          e.target.executeScript({
            code: "(function () { var iframes =  document.getElementsByTagName('iframe'); for (i = 0; i < iframes.length; ++i) { iframes[i].outerHTML = ''; } })();"
          });
        }
        if (reset || useScreensaver) {
          setStatus('adding keepalive logging');
          ACTIVE_EVENTS.split(' ').forEach(function(type, i) {
            e.target.executeScript({
              code: "document.addEventListener('" + type + "',function(){console.log('kiosk:active')},false)"
            });
          });
        }
        setStatus('setting navigation status');
        setNavStatus();
        setStatus('content load complete');
        $("#status").hide();
      })
      .on('loadcommit', function(e) {
        if (e.originalEvent.isTopLevel && $webview.parent().attr('id').indexOf('screensaver') < 0) {
          var err = getDomainWhiteListError(e.originalEvent.url);
          if (err) {
            var webview = $webview.get(0);
            webview.stop();
            webview.back();
            Materialize.toast(err, 4000);
            return;
          }
        }
        if (useragent) e.target.setUserAgentOverride(useragent);
      });
    $webview[0].request.onBeforeSendHeaders.addListener(
      function(details) {
        if (authorization) {
          details.requestHeaders.push({
            name: 'Authorization',
            value: authorization
          });
        }
        return {
          requestHeaders: details.requestHeaders
        };
      }, {
        urls: ["<all_urls>"]
      }, ["blocking", "requestHeaders"]);
    if (allowNewWindow) {
      $webview.on('newwindow', function(e) {
          // check if the pop-up URL is allowed
          var err = getDomainWhiteListError(e.originalEvent.targetUrl);
          if (err) {
            Materialize.toast(err, 4000);
            return;
          }

          // open the window in a new tab if selected
          if (newWindowMode === 'tab') {
            var id = loadURL(e.originalEvent.targetUrl, {
              type: 'newwindow'
            });
            e.originalEvent.window.attach($('#' + id + ' > webview')[0]);
            return;
          }

          //otherwise open in a modal, by default
          $('#newWindow webview').addClass('stale');
          var $newWebview = $('<webview/>');
          initWebview($newWebview);
          $newWebview.css({
            right: '1px',
            width: '99%'
          });
          $newWebview.on('close', function(e) {
            try {
              $('#newWindow').modal('close');
            } catch (err) {
              console.error(err);
            }
          });
          e.originalEvent.window.attach($newWebview[0]);
          $('#newWindow').append($newWebview).modal('open');
          setTimeout(function() {
            $('#newWindow webview.stale').remove();
            $newWebview.css({
              bottom: 0,
              right: 0,
              top: 0,
              left: 0,
              height: '100%',
              width: '100%'
            });
          }, 10);
        })
        .on('dialog', function(e) {
          var $modal;
          if (e.originalEvent.messageType == "alert") {
            $modal = $('#dialogAlert');
          } else if (e.originalEvent.messageType == "confirm") {
            e.preventDefault();
            $modal = $('#dialogConfirm');
          } else if (e.originalEvent.messageType == "prompt") {
            e.preventDefault();
            $modal = $('#dialogPrompt');
            $modal.find('.input-field > input').attr('placeholder', e.originalEvent.defaultPromptText);
          }
          if ($modal) {
            $modal.find('.text').text(e.originalEvent.messageText);
            $modal.modal('open');
            $modal.find('a.ok').click(function() {
              $modal.modal('close');
              try {
                e.originalEvent.dialog.ok($modal.find('#promptValue').val());
              } catch (err) {
                console.error(err)
              }
              return;
            });
            $modal.find('a.cancel').click(function() {
              $modal.modal('close');
              try {
                e.originalEvent.dialog.cancel();
              } catch (err) {
                console.error(err)
              }
              return;
            });
          }
        });
    }
  }

  function refreshContent(screensaver) {
    $('.tab > .type-newwindow').parent().remove();
    $('.type-newwindow').remove();
    updateTabs();
    $('#' + (screensaver ? 'screensaver' : 'content') + ' webview').each(function(i, webview) {
      webview.src = $(webview).data('src');
    });
  }

  function loadContent(alsoLoadScreensaver) {
    setStatus('loading content');
    if (!$('body').hasClass('screensaverActive')) {
      startScreensaverTimeout();
      startResetTimeout();
      startScheduledResetInterval();
    }
    if (alsoLoadScreensaver && screensaverURL) {
      $('#screensaver .browser').remove();
      loadURL(screensaverURL, {
        type: 'screensaver'
      });
    }
    if (!currentURL) return;
    if (!Array.isArray(currentURL)) currentURL = [currentURL];
    $('#content .browser').remove();
    $('#tabs .tab').remove();
    currentURL.forEach(loadURL);
  }

  function updateTabs(selectId) {
    var $tabs = $('#tabs > ul.tabs');
    var numTabs = $tabs.children('.tab').length;
    var colClass = 's1';
    switch (numTabs) {
      case 1:
        colClass = 's12';
        break;
      case 2:
        colClass = 's6';
        break;
      case 3:
        colClass = 's4';
        break;
      case 4:
        colClass = 's3';
        break;
      case 5:
        colClass = 's2';
        break;
      case 6:
        colClass = 's2';
        break;
    }
    $tabs.children().removeAttr('style');
    $('#content').children().removeAttr('style');
    $tabs.children('.tab').attr('class', 'tab col ' + colClass);
    if (numTabs > 1) {
      $('body').addClass('tabbed');
    } else {
      $('body').removeClass('tabbed');
    }
    if (numTabs > 12) {
      $tabs.addClass('scroll');
    } else {
      $tabs.removeClass('scroll');
    }
    if (showTopBar || $tabs.children('.type-newwindow').length) {
      $('body').addClass('show-top-bar');
    } else {
      $('body').removeClass('show-top-bar');
    }
    if (!$tabs.find('.active').length) {
      $tabs.first('li > a').addClass('active');
    }
    $tabs.tabs({
      onShow: function(tab) {
        setNavStatus();
      }
    });
    if (selectId) {
      $tabs.find('.active').removeClass('active');
      $tabs.tabs('select_tab', selectId);
    }
  }

  function closeTab(e) {
    var id = $(e.target).parent().attr('href').substring(1);
    $('#' + id + '.browser').remove();
    $(e.target).parents('.tab').remove();
    updateTabs();
  }

  function loadURL(url, options) {
    setStatus('loading url: ' + url);
    var type = (options && options.type) || 'content';
    var isScreensaver = (type === 'screensaver');
    var isNewWindow = (type === 'newwindow');

    // add a tab, if not the screensaver
    var $tabs = $('#tabs > ul.tabs');
    var numTabs = $tabs.children('.tab').length;
    var id = isScreensaver ? "screensaver-browser" : ('browser' + (++numTabs));
    var style = isScreensaver ? '' : 'display: none'
    var $webviewContainer = $('<div id="' + id + '" class="browser type-' + type + '" style="' + style + '"/>');
    if (!isScreensaver) {
      var $tab = $('<li class="tab"><a class="content type-' + type + '" href="#' + id + '"><span class="title">' + url + '</span></a></li>');
      // allow closing of new window pop-ups
      if (isNewWindow) {
        var $close = $('<i class="material-icons close">close</i>');
        $tab.children('a').append($close);
        $close.click(closeTab);
      }
      $tab.appendTo($tabs);
    }

    // add the associated webview
    $webviewContainer.appendTo(isScreensaver ? '#screensaver' : '#content');
    var $webview = $('<webview />');
    setStatus('initializing webview');
    initWebview($webview);
    $webview
      .data('id', id)
      .data('src', url)
      .attr('src', url)
      .appendTo($webviewContainer);

    updateTabs(isNewWindow ? id : null);
    return id;
  }

  function clearCache(cb) {
    if (resetcache) { //set true when we're restarting once after saving from admin
      if (chrome.storage) {
        chrome.storage.local.set({
          resetcache: false
        });
      }
      resetcache = false;
    }
    //remove entire cache
    var clearDataType = {
      appcache: true,
      cache: true,
      cookies: true,
      sessionCookies: true,
      persistentCookies: true,
      fileSystems: true,
      indexedDB: true,
      localStorage: true,
      webSQL: true
    };
    var webviews = $('webview').get();
    async.each(webviews, function(webview, done) {
      webview.clearData({
        since: 0
      }, clearDataType, done);
    }, cb);
  }

  function onEnded(event) {
    if (!restarting) {
      restarting = true;
      $("#browserContainer").remove();
      setTimeout(function() {
        loadContent(true);
        restarting = false;
      }, RESTART_DELAY);
    }
  }

});