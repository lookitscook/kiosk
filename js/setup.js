var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes
var FN_BASE_URL = 'https://us-central1-causal-shell-204520.cloudfunctions.net/';
var PAIR_URL = FN_BASE_URL + 'pair';

var uuid;

$(function() {

  function updateData(data) {
    if (data.newwindow) {
      $("#newwindow").prop("checked", true);
    }
    
    if (uuid) {
      $('#displayDeviceUUID').text(uuid);
    }

    if (data.url) {
      var urls = [];
      if (Array.isArray(data.url)) {
        urls = data.url;
      } else {
        //only a single content item, legacy support
        urls.push(data.url);
      }
      $('#displayContentURL').text(urls.join(', '));
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

    if (data.rotaterate) {
      $("#rotate-rate").val(data.rotaterate);
    }

    if (data.multipleurlmode) {
      $('#multiple-url-mode').children("[value='" + data.multipleurlmode + "']").prop('selected', true);
      if (data.multipleurlmode == 'rotate') {
        $('.rotate-rate').removeClass('disabled');
      }
    }
    
    if (data.shownav) {
      $("#shownav").prop("checked", true);
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

    $('select').material_select();
  }

  async.series([
    function(next) {
      $.getJSON(system.getSchemaUrl(), function(res) {
        schema = res || {};
        next();
      });
    },
    function(next) {
      system.getLocalStorage(null, function(res) {
        data = res || {};
        uuid = data.uuid;
        next(null, res);
      });
    },
  ], function(err, res) {

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
          $('#displayContentURL').text(urls.join(', '));
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

    $("#restart").on('change', function() {
      if ($("#restart").is(':checked')) {
        $('.restart').hide().removeClass('disabled').slideDown();
      } else {
        $('.restart').slideUp();
      }
    });
    
    $("#remote-schedule").on('change', function() {
      if ($("#remote-schedule").is(':checked')) {
        $('.remote-schedule-detail').hide().removeClass('disabled').slideDown();
      } else {
        $('.remote-schedule-detail').slideUp();
      }
    });

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

    $('#exit').click(function(e) {
      e.preventDefault();
      chrome.app.window.current().close();
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
      return inputString.split(', ').map(function(v) {
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
      updated.rotaterate = parseFloat($("#rotate-rate").val()) ? parseFloat($("#rotate-rate").val()) : 0;
      updated.displaysysteminfo = $('#displaySystemInfo').val();
      updated.restart = $("#restart").is(':checked');
      updated.restartday = $('#restartday').val();
      updated.scheduledreset = $("#scheduled-reset").is(':checked');
      updated.remoteschedule = $("#remote-schedule").is(':checked');
      updated.remotescheduleurl = $("#remote-schedule-url").val();
      updated.schedulepollinterval = parseFloat($('#schedule-poll-interval').val()) ? parseFloat($('#schedule-poll-interval').val()) : DEFAULT_SCHEDULE_POLL_INTERVAL;
      updated.shownav = $('#shownav').is(':checked');

      if (updated.restart) {
        updated.restart = parseInt($('#hour').val()) + parseInt($('#houroffset').val());
      } else {
        delete updated.restartday;
        delete updated.restart;
      }
      if (updated.scheduledreset) {
        updated.scheduledreset = parseFloat($('#scheduledresetinterval').val()) || 0;
        if (updated.scheduledreset <= 0) {
          delete updated.scheduledreset;
          error.push("Scheduled reset time is required.");
        }
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
      system.removeLocalStorage(remove);
      system.setLocalStorage(updated);
      system.restart();
    });
  });

  function validateURL(url) {
    return url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 ? null : 'Invalid URL';
  }

  $('#pair-device').click(function() {
    var pairingToken = $('#pairing-token').val();
    var label = $('#label').val();
    if (!pairingToken.length) {
      Materialize.toast('Pairing token is required.', 4000);
      return;
    }
    if (!label.length) {
      Materialize.toast('Device label is required.', 4000);
      return;
    }
    $.ajax({
      url: PAIR_URL,
      method: 'POST',
      data: {
        pairingToken: pairingToken,
        uuid: uuid,
        label: label
      },
      success: function(data) {
        system.setLocalStorage({
          paired_user_id: data.userId
        }, restartApplication);
      },
      error: function(err) {
        console.error(err);
        if (err.responseJSON && err.responseJSON.error === 'quota_reached') {
          Materialize.toast('Account device limit reached. Please increase your subscription quanitity.', 4000);
          return;
        }
        Materialize.toast('Pairing error', 4000);
      },
    });
  });

  var restartApplication = function() {
    system.restart();
  }

});