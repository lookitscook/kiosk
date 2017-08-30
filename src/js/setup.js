var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes

$(function() {

  function updateData(data) {
    if (data.newwindow) {
      $("#newwindow").prop("checked", true);
    }
    if (data.url) {
      var urlTags = [];
      if (Array.isArray(data.url)) {
        //possibly multiple content items
        for (var i = 0; i < data.url.length; i++) {
          urlTags.push({
            tag: data.url[i]
          });
        }
      } else {
        //only a single content item, legacy support
        urlTags.push({
          tag: data.url
        });
      }
      $('#url').material_chip({
        data: urlTags
      });
      if (urlTags.length > 1) {
        $('.multiple-url-mode').removeClass('disabled').show();
      }
    }
    if (data.whitelist) {
      var whitelistTags = [];
      if (Array.isArray(data.whitelist)) {
        //possibly multiple content items
        for (var i = 0; i < data.whitelist.length; i++) {
          whitelistTags.push({
            tag: data.whitelist[i]
          });
        }
      } else {
        //only a single content item
        whitelistTags.push({
          tag: data.whitelist
        });
      }
      $('#whitelist').material_chip({
        data: whitelistTags
      });
    }
    if (data.rotaterate) {
      $("#rotate-rate").val(data.rotaterate);
    }
    if (data.multipleurlmode) {
      $("#multiple-url-mode").val(data.multipleurlmode);
      if (data.multipleurlmode == 'rotate') {
        $('.rotate-rate').removeClass('disabled');
      }
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
    if (data.remote) {
      $("#remote").prop("checked", true);
      $('.remote, .settings-detail').removeClass('disabled');
    }
    if (data.username) $("#username").val(data.username).siblings('label').addClass('active');
    if (data.password) {
      $("#password").val(data.password).siblings('label').addClass('active');
      $("#confirm_password").val(data.password).siblings('label').addClass('active');
    }
    if (data.host) {
      $('#host').children("[value='" + data.host + "']").prop('selected', true);
    }
    if (data.port) $("#port").val(data.port);

    if (data.remoteschedule) {
      $("#remote-schedule").prop("checked", true);
      $('.remote-schedule-detail').removeClass('disabled');
    }
    if (data.remotescheduleurl)
      $("#remote-schedule-url").val(data.remotescheduleurl).siblings('label').addClass('active');

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
      $("#resetinterval").val(data.reset).siblings('label').addClass('active');
    }
    if (data.screensavertime && data.screensaverurl) {
      $('#use-screensaver').prop("checked", true);
      $('.use-screensaver').removeClass('disabled');
      $("#screensaver-time").val(parseFloat(data.screensavertime)).siblings('label').addClass('active');
      $('#screensaver-url').val(data.screensaverurl).siblings('label').addClass('active');
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
      $("#hour").siblings('label').addClass('active');
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
    if (data.useragent) $('#useragent').val(data.useragent).siblings('label').addClass('active');
    if (data.authorization) $('#authorization').val(data.authorization).siblings('label').addClass('active');

  }

  async.series([
    function(next) {
      $.getJSON(chrome.runtime.getURL("../schema.json"), function(res) {
        next(null, res);
      });
    },
    function(next) {
      chrome.storage.managed.get(null, function(res) {
        next(null, res);
      });
    },
    function(next) {
      chrome.storage.local.get(null, function(res) {
        next(null, res);
      });
    },
    function(next) {
      chrome.system.network.getNetworkInterfaces(function(res) {
        next(null, res);
      });
    },
  ], function(err, res) {

    var schema = res[0];
    var data = {};
    _.defaults(data, res[1], res[2]);
    var networkInterfaces = res[3];

    for (var i in networkInterfaces) {
      var networkInterface = networkInterfaces[i];
      var opt = document.createElement("option");
      opt.value = networkInterface.address;
      opt.innerText = networkInterface.name + " - " + networkInterface.address;
      document.getElementById("host").appendChild(opt);
    }

    $('#url').material_chip({
      placeholder: '+URL',
      secondaryPlaceholder: 'Content URL'
    });
    $('#url').on('chip.add', function(e, chip) {
      var err = validateURL(chip.tag);
      if (err) {
        Materialize.toast(err, 4000);
      }
      toggleMultipleMode();
    });
    $('#url').on('chip.delete', function(e, chip) {
      toggleMultipleMode();
    });

    function toggleMultipleMode() {
      var chips = $('.chips-initial').material_chip('data');
      if (chips.length == 2) {
        $('.multiple-url-mode').hide().removeClass('disabled').slideDown();
      } else if (chips.length <= 1) {
        $('.multiple-url-mode').slideUp();
      }
    }

    $('#whitelist').material_chip({
      placeholder: '+Domain',
      secondaryPlaceholder: '+Domain'
    });
    $('#whitelist').on('chip.add', function(e, chip) {
      var err;
      if (chip.tag.indexOf('.') < 0) {
        Materialize.toast('Whitelist domain must be valid top-level domain.', 4000);
      }
    });

    // UX: Simulate an enter keypress whenever the Chips input loses focus
    $('#url').on('blur', ':input', function() {
      if (this.value && this.value.length) {
        var err = validateURL(this.value);

        if (err) {
          Materialize.toast(err, 4000);
          return false;
        }

        $(this).trigger($.Event('keydown', {
          which: 13
        }));
      }
    });

    $('#whitelist').on('blur', ':input', function() {
      if (this.value && this.value.length) {
        if (this.value.indexOf('.') < 0) {
          Materialize.toast('Whitelist domain must be valid top-level domain.', 4000);
          return false;
        }
        $(this).trigger($.Event('keydown', {
          which: 13
        }));
      }
    });

    $('select').material_select();

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
        if (!$("#remote").is(':checked')) $('.settings-detail').hide().removeClass('disabled').slideDown();
      } else {
        $('.local').slideUp();
        if (!$("#remote").is(':checked')) $('.settings-detail').slideUp();
      }
    });
    $("#remote").on('change', function() {
      if ($("#remote").is(':checked')) {
        $('.remote').hide().removeClass('disabled').slideDown();
        if (!$("#local").is(':checked')) $('.settings-detail').hide().removeClass('disabled').slideDown();
      } else {
        $('.remote').slideUp();
        if (!$("#local").is(':checked')) $('.settings-detail').slideUp();
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
        $('#url').val('http://127.0.0.1:' + $('#servelocalport').val() + '/').siblings('label').addClass('active');
      } else {
        $('#url').val('').siblings('label').removeClass('active');
      }
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
      var policy = encodeURIComponent(JSON.stringify(_.mapValues(updated, function(v) {
        return {
          "Value": v
        };
      }), null, 2));
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
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + text);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    function validateData() {
      var error = [];
      var updated = {};
      updated.url = $('#url').material_chip('data');
      updated.whitelist = $('#whitelist').material_chip('data');
      updated.multipleurlmode = $("#multiple-url-mode").val();
      updated.rotaterate = parseFloat($("#rotate-rate").val()) ? parseFloat($("#rotate-rate").val()) : 0;
      updated.host = $('#host').val();
      updated.remote = $("#remote").is(':checked');
      updated.allowprint = $("#allowprint").is(':checked');
      updated.hidegslidescontrols = $("#hidegslidescontrols").is(':checked');
      updated.local = $("#local").is(':checked');
      updated.restart = $("#restart").is(':checked');
      updated.restartday = $('#restartday').val();
      updated.port = parseInt($('#port').val());
      updated.port = updated.port < 0 ? 0 : updated.port;
      updated.reset = $("#reset").is(':checked');
      updated.resetcookies = $('#clear-cookies-reset').is(':checked') || $('#screensaver-reset').is(':checked');
      var useScreensaver = $('#use-screensaver').is(':checked');
      updated.screensaverTime = parseFloat($('#screensaver-time').val()) || 0;
      updated.screensaverURL = $('#screensaver-url').val();
      updated.hidecursor = $("#hidecursor").is(':checked');
      updated.disablecontextmenu = $("#disablecontextmenu").is(':checked');
      updated.disabledrag = $("#disabledrag").is(':checked');
      updated.disabletouchhighlight = $("#disabletouchhighlight").is(':checked');
      updated.disableselection = $("#disableselection").is(':checked');
      updated.newwindow = $("#newwindow").is(':checked');
      updated.useragent = $('#useragent').val();
      updated.authorization = $('#authorization').val();
      updated.username = $("#username").val();
      updated.password = $("#password").val();
      var passwordConfirm = $("#confirm_password").val();
      updated.remoteschedule = $("#remote-schedule").is(':checked');
      updated.emotescheduleurl = $("#remote-schedule-url").val();
      updated.schedulepollinterval = parseFloat($('#schedule-poll-interval').val()) ? parseFloat($('#schedule-poll-interval').val()) : DEFAULT_SCHEDULE_POLL_INTERVAL;
      updated.sleepmode = $("#sleep-mode").val();
      updated.resetcache = $('#reset-cache').is(':checked');
      updated.shownav = $('#shownav').is(':checked');

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
        if (updated.screensaverTime <= 0) {
          delete updated.screensaverTime;
          error.push('Screensaver time is required.');
        }
        if (!updated.screensaverURL) {
          error.push('Screensaver URL is required.');
        }
      } else {
        delete updated.screensaverTime;
        delete updated.screensaverURL;
      }
      if (updated.url && Array.isArray(updated.url) && updated.url.length) {
        var err;
        var contentURL = [];
        for (var i = 0; i < updated.url.length; i++) {
          err = validateURL(updated.url[i].tag);
          if (err) {
            error.push(err);
            break;
          }
          contentURL.push(updated.url[i].tag);
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
      if (updated.whitelist && Array.isArray(updated.url)) {
        var whitelistDomains = [];
        for (var i = 0; i < updated.whitelist.length; i++) {
          if (updated.whitelist[i].tag.indexOf('.') < 0) {
            error.push('Whitelist domain must be valid top-level domain.');
          } else {
            whitelistDomains.push(updated.whitelist[i].tag);
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
      if ((updated.remote || updated.local)) {
        if (!updated.username) {
          error.push("Username is required.");
        }
        if (!updated.password) {
          error.push("Password is required.");
        } else if (updated.password != passwordConfirm) {
          error.push("Passwords must match.");
        }
        if (updated.remote) {
          if (!updated.port) {
            error.push("Port is required.");
          } else if (updated.port < 1024) {
            error.push("Remote admin. port must be above 1024");
          }
          if (!updated.host) {
            error.push("Host is required.");
          }
        } else {
          delete updated.port;
          delete updated.host;
        }
      } else {
        delete updated.port;
        delete updated.host;
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
      chrome.runtime.sendMessage('reload');
    });
  });

  function validateURL(url) {
    return url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 ? null : 'Invalid content URL';
  }

});