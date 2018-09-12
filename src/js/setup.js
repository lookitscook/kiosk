var LICENSED = true;
var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes

$(function() {

  if (LICENSED) {
    $('body').removeClass('unlicensed').addClass('licensed');
  }

  function updateData(data) {
    if (data.newwindow) {
      $("#newwindow").prop("checked", true);
    }
    if (data.disallowupload) {
      $("#disallowupload").prop("checked", true);
    }

    if (data.disallowiframes) {
      $("#disallowiframes").prop("checked", true);
    }
    if (data.url) {
      var urls = [];
      if (Array.isArray(data.url)) {
        urls = data.url;
      } else {
        //only a single content item, legacy support
        urls.push(data.url);
      }
      $('#displayContentURL').text(urls.join(','));
      $('#url').val(urls.join(', '));
      if (urls.length > 1) {
        $('.multiple-url-mode').removeClass('disabled').show();
      }
    }
    if (data.tokenserver) {
      $('#tokenserver').val(data.tokenserver);
    }
    if (data.customtoken) {
      $('#customtoken').val(data.customtoken);
    }
    if (data.whitelist) {
      var whitelistDomains = [];
      if (Array.isArray(data.whitelist)) {
        //possibly multiple content items
        whitelistDomains = data.whitelist;
      } else {
        //only a single content item
        whitelistDomains.push(data.whitelist);
      }
      $('#whitelist').val(whitelistDomains.join(', '));
    }
    if (data.rotaterate) {
      $("#rotate-rate").val(data.rotaterate);
    }
    if (data.startupdelay) {
      $("#startup-delay").val(data.startupdelay);
    }
    if (data.multipleurlmode) {
      $('#multiple-url-mode').children("[value='" + data.multipleurlmode + "']").prop('selected', true);
      if (data.multipleurlmode == 'rotate') {
        $('.rotate-rate').removeClass('disabled');
      }
    }
    if (data.newwindowmode) {
      $('#newwindow-mode').children("[value='" + data.newwindowmode + "']").prop('selected', true);
    }
    if (data.allowprint) {
      $("#allowprint").prop("checked", true);
    }
    if (data.hidegslidescontrols) {
      $("#hidegslidescontrols").prop("checked", true);
    }
    if (data.local) {
      $("#local").prop("checked", true);
      $('.local, .settings-detail').removeClass('disabled');
    }
    if (data.shownav) {
      $("#shownav").prop("checked", true);
    }
    if (data.showbattery) {
      $("#showbattery").prop("checked", true);
    }
    if (data.username) $("#username").val(data.username);
    if (data.password) {
      $("#password").val(data.password);
      $("#confirm_password").val(data.password);
    }
    if (data.displaysysteminfo) {
      $('#displaySystemInfo').children("[value='" + data.displaysysteminfo + "']").prop('selected', true);
    }

    if (data.remoteschedule) {
      $("#remote-schedule").prop("checked", true);
      $('.remote-schedule-detail').removeClass('disabled');
    }
    if (data.remotescheduleurl)
      $("#remote-schedule-url").val(data.remotescheduleurl);

    if (data.schedulepollinterval) {
      $('#schedule-poll-interval').val(data.schedulepollinterval);
    }
    if (data.sleepmode) {
      $('#sleep-mode').children("[value='" + data.sleepmode + "']").prop('selected', true);
    }

    if (data.reset && parseFloat(data.reset)) {
      var reset = parseFloat(data.reset);
      $("#reset").prop("checked", true);
      $('.reset').removeClass('disabled');
      $("#resetinterval").val(data.reset);
    }
    if (data.screensavertime && data.screensaverurl) {
      $('#use-screensaver').prop("checked", true);
      $('.use-screensaver').removeClass('disabled');
      $("#screensaver-time").val(parseFloat(data.screensavertime));
      $('#screensaver-url').val(data.screensaverurl);
    }
    if (data.clearcookiesreset) $("#clear-cookies-reset, #screensaver-reset").prop("checked", true);
    if (data.restart && parseInt(data.restart)) {
      var restart = parseInt(data.restart);
      $('#houroffset > option').removeAttr('selected');
      if (restart > 12) {
        restart = restart - 12;
        $("#houroffset option:contains('PM')").prop('selected', true);
      } else {
        $("#houroffset option:contains('AM')").prop('selected', true);
      }
      $("#restart").prop("checked", true);
      $('.restart').removeClass('disabled');
      $('#hour option').removeAttr('selected');
      $("#hour option[value=" + restart + "]").prop('selected', true);
    }
    if (data.restartday) {
      $('#restartday > option').removeAttr('selected');
      $('#restartday > option.' + data.restartday).prop('selected', true);
    }
    if (data.hidecursor) $("#hidecursor").prop("checked", true);
    if (data.disablecontextmenu) $("#disablecontextmenu").prop("checked", true);
    if (data.disabledrag) $("#disabledrag").prop("checked", true);
    if (data.disabletouchhighlight) $("#disabletouchhighlight").prop("checked", true);
    if (data.disableselection) $("#disableselection").prop("checked", true);
    if (data.servelocaldirectory) {
      var servelocaldirectoryname = data.servelocaldirectory.split(':');
      servelocaldirectoryname = (servelocaldirectoryname.length == 2) ? servelocaldirectoryname[1] : null;
      if (servelocaldirectoryname) {
        $("#servelocal").prop("checked", true);
        $('.servelocal').removeClass('disabled');
        $("#servelocaldirectory").data('directory', data.servelocaldirectory);
        $("#servelocaldirectory").attr('value', servelocaldirectoryname);
      }
    }
    if (data.servelocalhost) {
      $('#servelocalhost').children("[value='" + data.servelocalhost + "']").prop('selected', true);
    }
    if (data.servelocalport) $("#servelocalport").val(data.servelocalport);
    if (data.useragent) $('#useragent').val(data.useragent);
    if (data.authorization) $('#authorization').val(data.authorization);

    $('select').material_select();
  }

  chrome.instanceID.getID(function(instanceid) {
    $('#displayInstanceID').text(instanceid);
  });

  async.series([
    function(next) {
      $.getJSON(chrome.runtime.getURL("../schema.json"), function(res) {
        next(null, res);
      });
    },
    function(next) {
      if (!LICENSED) {
        next(null, {});
        return;
      }
      chrome.storage.managed.get(null, function(res) {
        next(null, res);
      });
    },
    function(next) {
      chrome.storage.local.get(null, function(res) {
        next(null, res);
      });
    },
  ], function(err, res) {

    var schema = res[0];
    var data = {};
    _.defaults(data, res[1], res[2]);

    function toggleMultipleMode(urls) {
      if (urls.length >= 2) {
        $('.multiple-url-mode').hide().removeClass('disabled').slideDown();
      } else if (urls.length <= 1) {
        $('.multiple-url-mode').slideUp();
      }
    }

    $('#customtoken').on('change', function() {
      if (this && this.value) {
        try {
          JSON.parse(this.value);
        } catch (e) {
          Materialize.toast('Could not parse Custom Token JSON', 4000);
        }
      }
    });

    $('#url').on('change', function() {
      if (this.value && this.value.length) {
        var urls = parseURLs(this.value);
        var err;
        urls.forEach(function(url, i) {
          err = validateURL(url);
          if (err) {
            Materialize.toast(err, 4000);
          }
        });
        if (!err) {
          $('#displayContentURL').text(urls.join(','));
        }
        toggleMultipleMode(urls);
      } else {
        $('.multiple-url-mode').slideUp();
      }
    });

    $('#whitelist').on('change', function() {
      if (this.value && this.value.length) {
        var urls = parseURLs(this.value);
        urls.forEach(function(url, i) {
          if (url.indexOf('.') < 0) {
            Materialize.toast('Whitelist domain must be valid top-level domain.', 4000);
          }
        });
      }
    });

    $("#servelocal").on('change', function() {
      if ($("#servelocal").is(':checked')) {
        $('.servelocal').hide().removeClass('disabled').slideDown();
        if (!$("#servelocaldirectory").attr('value')) selectLocalDirectory();
      } else {
        $('.servelocal').slideUp();
      }
    });
    $('#changelocaldirectory').on('click', function() {
      selectLocalDirectory();
    });

    function selectLocalDirectory() {
      chrome.fileSystem.chooseEntry({
        type: "openDirectory"
      }, function(entry, fileEntries) {
        if (!entry) {
          Materialize.toast("No directory selected.", 4000);
          return;
        }
        var id = chrome.fileSystem.retainEntry(entry);
        chrome.fileSystem.isRestorable(id, function(isRestorable) {
          if (isRestorable) {
            $("#servelocaldirectory").data('directory', id);
            $("#servelocaldirectory").attr('value', entry.name);
          } else {
            Materialize.toast("Permission denied to restore directory '" + entry.name + "'.", 4000);
          }
        });
      });
    }
    $("#clear-cookies-reset").on('change', function(e) {
      if ($("#clear-cookies-reset").is(':checked')) {
        $("#screensaver-reset").prop("checked", true);
      } else {
        $("#screensaver-reset").prop("checked", false);
      }
    });
    $("#screensaver-reset").on('change', function(e) {
      if ($("#screensaver-reset").is(':checked')) {
        $("#clear-cookies-reset").prop("checked", true);
      } else {
        $("#clear-cookies-reset").prop("checked", false);
      }
    });
    $("#reset").on('change', function() {
      if ($("#reset").is(':checked')) {
        $('.reset').hide().removeClass('disabled').slideDown();
      } else {
        $('.reset').slideUp();
      }
    });
    $("#restart").on('change', function() {
      if ($("#restart").is(':checked')) {
        $('.restart').hide().removeClass('disabled').slideDown();
      } else {
        $('.restart').slideUp();
      }
    });
    $("#local").on('change', function() {
      if ($("#local").is(':checked')) {
        $('.local').hide().removeClass('disabled').slideDown();
      } else {
        $('.local').slideUp();
      }
    });
    $("#remote-schedule").on('change', function() {
      if ($("#remote-schedule").is(':checked')) {
        $('.remote-schedule-detail').hide().removeClass('disabled').slideDown();
      } else {
        $('.remote-schedule-detail').slideUp();
      }
    });

    $("#servelocal,#servelocalport").on('change', setLocalContentURL);

    $("#use-screensaver").on('change', function() {
      if ($("#use-screensaver").is(':checked')) {
        $('.use-screensaver').hide().removeClass('disabled').slideDown();
      } else {
        $('.use-screensaver').slideUp();
      }
    });

    function setLocalContentURL() {
      if ($("#servelocal").is(':checked')) {
        $('#url').val('http://127.0.0.1:' + $('#servelocalport').val() + '/');
      } else {
        $('#url').val('');
      }
      Materialize.updateTextFields();
    }

    $("#multiple-url-mode").on('change', function() {
      if ($("#multiple-url-mode").val() == 'rotate') {
        $('.rotate-rate').hide().removeClass('disabled').slideDown();
      } else {
        $('.rotate-rate').slideUp();
      }
    });

    updateData(data);

    $('#import-policy').click(function(e) {
      e.preventDefault();
      uploadPolicy();
    });

    $('#export-policy').click(function(e) {
      e.preventDefault();
      var updated = validateData();
      if (!updated) {
        return;
      }
      var policy = JSON.stringify(_.mapValues(updated, function(v) {
        return {
          "Value": v
        };
      }), null, 2);
      download("kiosk-policy.json", policy);
    });

    function uploadPolicy() {
      var element = document.createElement('input');
      element.setAttribute('type', 'file');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.addEventListener('change', function(e) {
        var file = element.files[0];
        var fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent) {
          updateData(_.mapValues(JSON.parse(fileLoadedEvent.target.result), function(a) {
            return a.Value;
          }));
          document.body.removeChild(element);
        };
        fileReader.readAsText(file, "UTF-8");
      });
      element.click();
    }

    function download(filename, text) {
      var errorHandler = function(err) {
        console.error('Error downloading file:', err);
      };
      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: filename
      }, function(writableFileEntry) {
        writableFileEntry.createWriter(function(writer) {
          writer.onerror = errorHandler;
          writer.write(new Blob([text], {
            type: 'text/plain'
          }));
        }, errorHandler);
      });
    }

    function parseURLs(inputString) {
      if (!inputString) {
        return null;
      }
      return inputString.split(',').map(function(v) {
        return v.trim();
      }).filter(function(v) {
        return !!v;
      });
    }

    function validateData() {
      var error = [];
      var updated = {};
      updated.url = parseURLs($('#url').val());
      updated.tokenserver = $('#tokenserver').val();
      updated.customtoken = $('#customtoken').val();
      updated.whitelist = parseURLs($('#whitelist').val());
      updated.multipleurlmode = $("#multiple-url-mode").val() || 'tabs';
      updated.newwindowmode = $("#newwindow-mode").val();
      updated.startupdelay = parseFloat($("#startup-delay").val()) ? parseFloat($("#startup-delay").val()) : 0;
      updated.rotaterate = parseFloat($("#rotate-rate").val()) ? parseFloat($("#rotate-rate").val()) : 0;
      updated.displaysysteminfo = $('#displaySystemInfo').val();
      updated.allowprint = $("#allowprint").is(':checked');
      updated.hidegslidescontrols = $("#hidegslidescontrols").is(':checked');
      updated.local = $("#local").is(':checked');
      updated.restart = $("#restart").is(':checked');
      updated.restartday = $('#restartday').val();
      updated.reset = $("#reset").is(':checked');
      updated.clearcookiesreset = $('#clear-cookies-reset').is(':checked') || $('#screensaver-reset').is(':checked');
      var useScreensaver = $('#use-screensaver').is(':checked');
      updated.screensavertime = parseFloat($('#screensaver-time').val()) || 0;
      updated.screensaverurl = $('#screensaver-url').val();
      updated.hidecursor = $("#hidecursor").is(':checked');
      updated.disablecontextmenu = $("#disablecontextmenu").is(':checked');
      updated.disabledrag = $("#disabledrag").is(':checked');
      updated.disabletouchhighlight = $("#disabletouchhighlight").is(':checked');
      updated.disableselection = $("#disableselection").is(':checked');
      updated.newwindow = $("#newwindow").is(':checked');
      updated.disallowupload = $("#disallowupload").is(':checked');
      updated.disallowiframes = $("#disallowiframes").is(':checked');
      updated.useragent = $('#useragent').val();
      updated.authorization = $('#authorization').val();
      updated.username = $("#username").val();
      updated.password = $("#password").val();
      var passwordConfirm = $("#confirm_password").val();
      updated.remoteschedule = $("#remote-schedule").is(':checked');
      updated.remotescheduleurl = $("#remote-schedule-url").val();
      updated.schedulepollinterval = parseFloat($('#schedule-poll-interval').val()) ? parseFloat($('#schedule-poll-interval').val()) : DEFAULT_SCHEDULE_POLL_INTERVAL;
      updated.sleepmode = $("#sleep-mode").val();
      updated.resetcache = $('#reset-cache').is(':checked');
      updated.shownav = $('#shownav').is(':checked');
      updated.showbattery = $('#showbattery').is(':checked');

      var servelocal = $("#servelocal").is(':checked');
      updated.servelocaldirectory = $('#servelocaldirectory').data('directory');
      updated.servelocalhost = $('#servelocalhost').val();
      updated.servelocalport = parseInt($('#servelocalport').val());
      updated.servelocalport = updated.servelocalport < 0 ? 0 : updated.servelocalport;

      if (updated.restart) {
        updated.restart = parseInt($('#hour').val()) + parseInt($('#houroffset').val());
      } else {
        delete updated.restartday;
        delete updated.restart;
      }
      if (updated.reset) {
        updated.reset = parseFloat($('#resetinterval').val());
        if (!reset) reset = 0;
        if (updated.reset <= 0) {
          delete updated.reset;
          error.push("Inactivity reset time is required.");
        }
      }
      if (useScreensaver) {
        if (updated.screensavertime <= 0) {
          delete updated.screensavertime;
          error.push('Screensaver time is required.');
        }
        if (!updated.screensaverurl) {
          error.push('Screensaver URL is required.');
        }
      } else {
        delete updated.screensavertime;
        delete updated.screensaverurl;
      }
      if (updated.url && Array.isArray(updated.url) && updated.url.length) {
        var err;
        var contentURL = [];
        for (var i = 0; i < updated.url.length; i++) {
          err = validateURL(updated.url[i]);
          if (err) {
            error.push(err);
            break;
          }
          contentURL.push(updated.url[i]);
        }
        if (err) {
          delete updated.url;
        } else {
          updated.url = contentURL;
        }
      } else {
        delete updated.url;
        error.push("Content URL is required.");
      }
      if (updated.newwindowmode === 'tab' && updated.multipleurlmode !== 'tabs') {
        delete updated.newwindowmode;
        error.push('Tabbed mode for new windows requires tabs mode for multiple URLs')
      }

      if (updated.customtoken) {
        try {
          JSON.parse(updated.customtoken);
        } catch (e) {
          error.push('Could not parse Custom Token JSON.');
        }
      }
      if (updated.whitelist && Array.isArray(updated.whitelist) && updated.whitelist.length) {
        var whitelistDomains = [];
        for (var i = 0; i < updated.whitelist.length; i++) {
          if (updated.whitelist[i].indexOf('.') < 0) {
            error.push('Whitelist domain must be valid top-level domain.');
          } else {
            whitelistDomains.push(updated.whitelist[i]);
          }
        }
        if (!whitelistDomains.length) {
          delete updated.whitelist;
        } else {
          updated.whitelist = whitelistDomains;
        }
      } else {
        delete updated.whitelist;
      }
      if (updated.local) {
        if (!updated.username) {
          error.push("Username is required.");
        }
        if (!updated.password) {
          error.push("Password is required.");
        } else if (updated.password != passwordConfirm) {
          error.push("Passwords must match.");
        }
      } else {
        delete updated.username;
        delete updated.password;
      }
      if (updated.multipleurlmode == 'rotate') {
        if (updated.rotaterate <= 0) {
          updated.rotaterate = false;
          error.push("The Multiple URL Rotate Rate must be greater then 0.");
        }
      } else {
        updated.rotaterate = false;
      }
      if (updated.remoteschedule) {
        if (updated.remotescheduleurl && (updated.remotescheduleurl.indexOf("http://") >= 0 || updated.remotescheduleurl.indexOf("https://") >= 0)) {
          //url is valid
          if (updated.schedulepollinterval <= 0) {
            updated.schedulepollinterval = false;
            error.push("Schedule Poll Interval must be greater then 0.");
          }
        } else {
          updated.schedulepollinterval = false;
          error.push("Schedule URL must be valid.");
        }
      } else {
        updated.schedulepollinterval = false;
      }
      if (servelocal) {
        if (!updated.servelocaldirectory) error.push("Directory is required for serving local files.");
        if (!updated.servelocalhost) error.push("Host is required for serving local files.");
        if (!updated.servelocalport) error.push("Port is required for serving local files.");
        else if (updated.servelocalport < 1024) error.push("Local port must be above 1024");
      } else {
        delete updated.servelocaldirectory;
        delete updated.servelocalhost;
        delete updated.servelocalport;
      }
      for (var field in schema.properties) {
        if (updated[field] && schema.properties[field].type !== 'array' && (typeof updated[field]).toLowerCase() !== schema.properties[field].type) {
          error.push(field + ' must be a ' + schema.properties[field].type + ' is ' + (typeof updated[field]).toLowerCase());
        }
      }
      if (error.length) {
        for (var i = 0; i < error.length; i++) {
          Materialize.toast(error[i], 4000);
        }
        return;
      }
      return updated;
    }

    $('#save').click(function(e) {
      e.preventDefault();
      var updated = validateData();
      if (!updated) {
        return;
      }
      var remove = [];
      for (var field in schema.properties) {
        if (!updated[field]) {
          remove.push(field);
        }
      }
      chrome.storage.local.remove(remove);
      chrome.storage.local.set(updated);
      chrome.runtime.restart(); //for ChromeOS devices in "kiosk" mode
      chrome.runtime.reload();
    });
  });

  function validateURL(url) {
    return url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 ? null : 'Invalid URL';
  }

});