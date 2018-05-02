var LICENSED = false;

$(function() {

  var RESTART_DELAY = 1000;
  var CHECK_SCHEDULE_DELAY = 30 * 1000; //check content against schedule every 30 seconds
  var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes
  var DEFAULT_ROTATE_RATE = 30; //seconds
  var ACTIVE_EVENTS = "click mousedown mouseup mousemove touch touchstart touchend keypress keydown";

  var restarting = false;
  var reset = false;
  var useScreensaver, screensaverTime, screensaverURL;
  var win = window;
  var resetTimeout, screensaverTimeout;
  var restart;
  var urlrotateindex = 0;
  var startupdelay = 0;
  var rotaterate;
  var whitelist;
  var schedule, scheduleURL, contentURL, defaultURL, currentURL, updateScheduleTimeout, checkScheduleTimeout, schedulepollinterval;
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
  var localAdmin = false;
  var displaySystemInfoOnKeypress = false;
  var tokens = {};

  init();

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

  function onKeypress(e) {
    //refresh on F3 or ctrl+r
    if ((e.which == 168) || (e.which == 82 && e.ctrlKey)) {
      loadContent(true);
      return;
    }
    //open admin login on ctrl+a
    if (localAdmin && e.which == 65 && e.ctrlKey) {
      chrome.runtime.getBackgroundPage(function(backgroundPage) {
        backgroundPage.stopAutoRestart();
        $('#login').modal('open');
        $('#username').focus();
        $('#passwordLabel').addClass('active');
      });
    }
    //print on ctrl+p
    if (allowPrint && e.which == 80 && e.ctrlKey) {
      var activeBrowserID = $('#tabs a.active').attr('href');
      $(activeBrowserID + ' webview').get(0).print();
    }
    //show system informaton on crl+i
    if (displaySystemInfoOnKeypress && e.which == 73 && e.ctrlKey) {
      showSystemInformation(5000);
    }
  }

  function showSystemInformation(duration) {
    chrome.instanceID.getID(function(instanceID) {
      Materialize.toast('InstanceID: ' + instanceID + '<br>Content: ' + contentURL.join(','), duration);
    });
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
    chrome.runtime.restart(); //for ChromeOS devices in "kiosk" mode
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

    $(document).keydown(onKeypress);

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
    $('.modal').not('#newWindow').modal();
    $('#newWindow').modal({
      complete: function() {
        $('#newWindow webview').remove();
      }
    });
  }

  function init() {

    if (LICENSED) {
      $('body').removeClass('unlicensed').addClass('licensed');
    }

    initEventHandlers();

    initModals();
    var data = {};
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
      }
    ], function(err) {

      if (!LICENSED) {
        //disable pro features
        data.tokenserver = null;
        data.customtoken = null;
        data.remoteschedule = null;
        data.remotescheduleurl = null;
      }

      //get tokens
      var useTokens = LICENSED && (Array.isArray(data.url) ? data.url : [data.url]).some(function(url) {
        return url.indexOf('{') >= 0 && url.indexOf('}') >= 0;
      });

      async.series([
        function(next) {
          if (!useTokens) {
            next();
            return;
          }
          chrome.instanceID.getID(function(instanceid) {
            if (!instanceid) {
              console.error('No instance id acquired.');
              next();
              return;
            }
            tokens.instanceid = instanceid;
            next();
          });
        },
        function(next) {
          if (!useTokens) {
            next();
            return;
          }
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
        },
        function(next) {
          if (!useTokens || !data.tokenserver) {
            next();
            return;
          }
          $.getJSON(tokenizeUrl(data.tokenserver)).done(function(tokenServerTokens) {
            tokens = _.defaults(tokenServerTokens, tokens);
            next();
          }).fail(function(jqxhr, textStatus, error) {
            console.error('Error getting tokens from server:', error);
            next();
          });
        },
        function(next) {
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

        allowPrint = !!data.allowprint;

        if (data.shownav) {
          $('body').addClass('show-nav');
        }

        if (data.displaysysteminfo) {
          if (data.displaysysteminfo === 'always') {
            showSystemInformation();
          }
          if (data.displaysysteminfo === 'keypress') {
            displaySystemInfoOnKeypress = true;
          }
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
              openWindow("windows/setup.html");
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
        allownewwindow = data.newwindow ? true : false;

        reset = data.reset && parseFloat(data.reset) > 0 ? parseFloat(data.reset) : false;
        screensaverTime = data.screensavertime && parseFloat(data.screensavertime) > 0 ? parseFloat(data.screensavertime) : false;
        screensaverURL = tokenizeUrl(data.screensaverurl);
        useScreensaver = screensaverTime && screensaverURL ? true : false;
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
        loadContent(true);
        if (resetcache) {
          setTimeout(function() {
            clearCache(function() {
              restartApplication();
            });
          }, 1000);
        }

      });
    });

    window.addEventListener('message', function(e) {
      var data = e.data;
      if (data.command == 'title' && data.title && data.id) {
        $('#tabs .tab.' + data.id + ' a').text(data.title);
      }
      if (data.command == 'keypress' && data.event) {
        onKeypress(data.event);
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
    startScreensaverTimeout();
    startResetTimeout();
  }

  function startScreensaverTimeout() {
    if (useScreensaver && !screensaverTimeout) {
      screensaverTimeout = setTimeout(function() {
        screensaverTimeout = false;
        if ($('body').hasClass('screensaverActive')) {
          return;
        }
        $('#newWindow').modal('close');
        $('#newWindow webview').remove();
        $('body').addClass('screensaverActive');
        if (clearcookies) {
          clearCache(function() {
            refreshContent(false);
          });
        } else {
          refreshContent(false);
        }
      }, screensaverTime * 60 * 1000);
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
    if ($webview.get(0).canGoBack()) {
      $('#nav .back').removeClass('inactive');
    } else {
      $('#nav .back').addClass('inactive');
    }
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
        if (e.isTopLevel) onEnded(e);
      })
      .on('consolemessage', function(e) {
        if (e.originalEvent.message == 'kiosk:active') active();
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
        }
      })
      .on('contentload', function(e) {
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
            "});" +
            "window.onkeydown = function(e){ kioskAppWindow.postMessage({ command:'keypress', event: { keyCode: e.keyCode || e.which, which: e.which || e.keyCode, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey } }, kioskAppOrigin); }"
        });
        browser.contentWindow.postMessage({
          command: 'kioskGetTitle',
          id: $webview.parent().attr('id')
        }, '*');

        if (hidegslidescontrols && browser.src.indexOf('https://docs.google.com/presentation') >= 0) {
          $webview.css({
            height: '99%',
            bottom: '1px'
          });
          browser.insertCSS({
            code: ".punch-viewer-nav-fixed{ display:none; visibility:hidden; }"
          });
          setTimeout(function() {
            $webview.css({
              height: '100%',
              bottom: 0,
            });
          }, 10);
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
        browser.focus();
      })
      .on('loadstop', function(e) {
        setNavStatus();
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
        if (reset) {
          ACTIVE_EVENTS.split(' ').forEach(function(type, i) {
            $webview[0].executeScript({
              code: "document.addEventListener('" + type + "',function(){console.log('kiosk:active')},false)"
            });
          });
        }
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
    if (allownewwindow) {
      $webview.on('newwindow', function(e) {
          var err = getDomainWhiteListError(e.originalEvent.targetUrl);
          if (err) {
            Materialize.toast(err, 4000);
            return;
          }
          $('#newWindow webview').remove();
          var $newWebview = $('<webview/>');
          initWebview($newWebview);
          $newWebview.css({
            right: '1px',
            width: '99%'
          });
          $newWebview.on('close', function(e) {
            $('#newWindow').modal('close');
            $('#newWindow webview').remove();
          });
          e.originalEvent.window.attach($newWebview[0]);
          $('#newWindow').append($newWebview).modal('open');
          setTimeout(function() {
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
          }
          /*else if(e.originalEvent.messageType == "confirm"){ //Confirmation and Prompts currently non-functional
                      $modal = $('#dialogConfirm');
                  }else if(e.originalEvent.messageType == "prompt"){
                      $modal = $('#dialogPrompt');
                      $modal.find('.input-field > input').attr('placeholder',e.originalEvent.defaultPromptText);
                  }*/
          if ($modal) {
            //e.preventDefault();
            $modal.find('.text').text(e.originalEvent.messageText);
            $modal.modal('open');
            $modal.find('a.ok').click(function() {
              $modal.modal('close');
              e.originalEvent.dialog.ok($modal.find('#promptValue').val());
              return;
            });
            $modal.find('a.cancel').click(function() {
              $modal.modal('close');
              e.originalEvent.dialog.cancel();
              return;
            });
          }
        });
    }
  }

  function refreshContent(screensaver) {
    $('#' + (screensaver ? 'screensaver' : 'content') + ' webview').each(function(i, webview) {
      webview.src = $(webview).data('src');
    });
  }

  function loadContent(alsoLoadScreensaver) {
    if (!$('body').hasClass('screensaverActive')) {
      startScreensaverTimeout();
      startResetTimeout();
    }
    if (alsoLoadScreensaver && screensaverURL) {
      $('#screensaver .browser').remove();
      loadURL(screensaverURL, 0, null, true);
    }
    if (!currentURL) return;
    if (!Array.isArray(currentURL)) currentURL = [currentURL];
    $('#content .browser').remove();
    $('#tabs .tab').remove();
    if (Array.isArray(currentURL) && currentURL.length > 1) {
      $('body').addClass('tabbed');
    } else {
      $('body').removeClass('tabbed');
    }
    var colClass = 's1';
    switch (currentURL.length) {
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
    for (var i = 0; i < currentURL.length; i++) {
      loadURL(currentURL[i], i, colClass);
    }
    var $tabs = $('ul.tabs');
    if (currentURL.length > 12) {
      $tabs.addClass('scroll');
    } else {
      $tabs.removeClass('scroll');
    }
    $tabs.tabs({
      onShow: function(tab) {
        setNavStatus();
      }
    });
  }

  function loadURL(url, i, colClass, isScreensaver) {
    var id = (isScreensaver ? "screensaver" : "browser") + i;
    if (!isScreensaver) {
      var $tab = $('<li class="tab col ' + colClass + ' ' + id + '"><a href="#' + id + '">' + url + '</a></li>').appendTo('#tabs .tabs');
    }
    var $webviewContainer = $('<div id="' + id + '" class="browser"/>');
    $webviewContainer.appendTo(isScreensaver ? '#screensaver' : '#content');
    var $webview = $('<webview />');
    initWebview($webview);
    $webview
      .data('id', id)
      .data('src', url)
      .attr('src', url)
      .appendTo($webviewContainer);
  }

  function clearCache(cb) {
    if (resetcache) { //set true when we're restarting once after saving from admin
      if (chrome.storage) {
        chrome.storage.local.remove('resetcache');
      }
      resetcache = false;
    }
    var clearDataType = {
      appcache: true,
      cache: true, //remove entire cache
      cookies: true,
      fileSystems: true,
      indexedDB: true,
      localStorage: true,
      webSQL: true,
    };
    deferredArray = [];
    $('#content webview').each(function(i, webview) {
      var deferred = new $.Deferred();
      webview.clearData({
        since: 0
      }, clearDataType, function() {
        deferred.resolve();
      });
      deferredArray.push(deferred);
    });
    $.when.apply($, deferredArray).then(function() {
      if (cb) {
        cb();
      }
    });
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

  function openWindow(path) {
    chrome.system.display.getInfo(function(d) {
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'setup',
        'state': 'fullscreen',
        'bounds': {
          'left': 0,
          'top': 0,
          'width': d[0].bounds.width,
          'height': d[0].bounds.height
        }
      }, function(w) {
        chrome.app.window.current().close();
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

});