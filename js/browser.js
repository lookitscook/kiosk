
$(function() {

  var FN_BASE_URL = 'https://us-central1-causal-shell-204520.cloudfunctions.net/';
  var CHECK_IN_URL = FN_BASE_URL + 'check_in';
  var CHECK_SCHEDULE_DELAY = 30 * 1000; //check content against schedule every 30 seconds
  var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes
  var DEFAULT_ROTATE_RATE = 30; //seconds

  var uuid;
  var scheduledReset = false;
  var scheduledResetInterval;
  var restart;
  var urlrotateindex = 0;
  var rotaterate;
  var schedule, scheduleURL, contentURL, defaultURL, currentURL, schedulepollinterval;
  var showNav = false;
  var showTopBar = false;
  var tokens = {};
  var allowNewWindow;

  setStatus('beginning initialization...');
  
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
      loadContent();
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
          loadContent();
        }
      } else if (currentURL != defaultURL) {
        currentURL = defaultURL;
        loadContent();
      }
    }
  }

  function restartApplication() {
    system.restart();
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
      var $iframe = $(activeBrowserID + ' iframe');
      var activeHomeURL = $iframe.data('src');
      $iframe.attr('src', activeHomeURL);
    });

    $('#nav .back').click(function(e) {
      if ($('#nav .back').hasClass('inactive')) {
        return;
      }
      var activeBrowserID = $('#tabs a.active').attr('href');
      var $iframe = $(activeBrowserID + ' iframe');
      $iframe.get(0).back();
    });

    $('#nav .refresh').click(function(e) {
      if ($('#nav .refresh').hasClass('inactive')) {
        return;
      }
      var activeBrowserID = $('#tabs a.active').attr('href');
      var $iframe = $(activeBrowserID + ' iframe');
      $iframe.attr('src', $iframe.attr('src'));
    });
  }

  function initModals() {
    $('.modal').modal();
  }

  function init() {

    setStatus('loading settings');
    async.series([
      function(next) {
        setStatus('Getting prior configuration');
        system.getLocalStorage(function(res) {
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
        system.setLocalStorage({
          uuid: data.uuid,
        }, next);
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
        return system.setLocalStorage(data, next);
      }
    ], function(err) {
  
      setStatus('Configuration lookup complete');
  
      if (err) {
        console.error('startup error', err);
        setStatus('Startup error: ' + (err.toString ? err.toString() : '-'));
      }
  
      if (!('url' in data) || !data.url) {
        if (('paired_user_id') in data) {
          // paired, just missing config
          setStatus('No configuration applied to this device.');
          return;
        }
        // need to set up
        setStatus('Initiating setup');
        window.location = './setup';
        return;
      }
      //setup has been completed

      setStatus('settings loaded');

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
        // TODO: use native js method to get IP address(es)
        /*function(next) {
          setStatus('setting network tokens');
          if (!useTokens) {
            next();
            return;
          }
          setStatus('getting network interfaces');
          system.getNetworkInterfaces(function(interfaces) {
            interfaces.forEach(function(interface) {
              if (!interface.name || !interface.address) {
                console.error('Missing details for network interface:', interface);
                return;
              }
              _.set(tokens, interface.name.toLowerCase() + '.ipaddress.' + (interface.address.indexOf(':') >= 0 ? 'ipv6' : 'ipv4'), interface.address);
            });
            next();
          });
        },*/
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

        showNav = !!data.shownav;
        showTopBar = showNav;

        if (showTopBar) {
          $('body').addClass('show-top-bar');
        }

        if (showNav) {
          $('body').addClass('show-nav');
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

        allowNewWindow = data.newwindow ? true : false;

        scheduledReset = data.scheduledreset && parseFloat(data.scheduledreset) > 0 ? parseFloat(data.scheduledreset) : false;

        defaultURL = contentURL = Array.isArray(data.url) ? data.url.map(function(url) {
          return tokenizeUrl(url);
        }) : [tokenizeUrl(data.url)];
        whitelist = Array.isArray(data.whitelist) ? data.whitelist : data.whitelist ? [data.whitelist] : [];

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

        loadContent();

      });
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

  function startScheduledResetInterval() {
    if (scheduledReset) {
      if (scheduledResetInterval) {
        clearInterval(scheduledResetInterval);
      }
      scheduledResetInterval = setInterval(function() {
        refreshContent();
      }, scheduledReset * 60 * 1000);
    }
  }

  function setNavStatus() {
    var activeBrowserID = $('#tabs a.active').attr('href');
    var $iframe = $(activeBrowserID + ' iframe');
    var activeHomeURL = $iframe.data('src');
    var currentURL = $iframe.attr('src');
    if (currentURL == activeHomeURL) {
      $('#nav .home').addClass('inactive');
    } else {
      $('#nav .home').removeClass('inactive');
    }
    if ($iframe.length && $iframe.get(0).canGoBack()) {
      $('#nav .back').removeClass('inactive');
    } else {
      $('#nav .back').addClass('inactive');
    }
    setStatus('set nav status complete');
  }

  function initIframe($iframe) {
    $iframe.css({
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }).on('load', function(){
      $('#status').hide();
    });
    var sandboxValue = "allow-scripts allow-forms";
    if (allowNewWindow) {
      sandboxValue += " allow-modals allow-popups";
    }
    $iframe.attr("sandbox", sandboxValue);
  }

  function refreshContent() {
    $('.tab > .type-newwindow').parent().remove();
    $('.type-newwindow').remove();
    updateTabs();
    $('#content iframe').each(function(i, iframe) {
      iframe.src = $(iframe).data('src');
    });
  }

  function loadContent() {
    setStatus('loading content');
    startScheduledResetInterval();
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
    var isNewWindow = (type === 'newwindow');

    // add a tab
    var $tabs = $('#tabs > ul.tabs');
    var numTabs = $tabs.children('.tab').length;
    var id = 'browser' + (++numTabs);
    var style = 'display: none'
    var $iframeContainer = $('<div id="' + id + '" class="browser type-' + type + '" style="' + style + '"/>');
    var $tab = $('<li class="tab"><a class="content type-' + type + '" href="#' + id + '"><span class="title">' + url + '</span></a></li>');
    // allow closing of new window pop-ups
    if (isNewWindow) {
      var $close = $('<i class="material-icons close">close</i>');
      $tab.children('a').append($close);
      $close.click(closeTab);
    }
    $tab.appendTo($tabs);

    // add the associated iframe
    $iframeContainer.appendTo('#content');
    var $iframe = $('<iframe />');
    setStatus('initializing iframe');
    initIframe($iframe);
    $iframe
      .data('id', id)
      .data('src', url)
      .attr('src', url)
      .appendTo($iframeContainer);

    updateTabs(isNewWindow ? id : null);
    return id;
  }

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
        return system.setLocalStorage(data, cb);
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

});