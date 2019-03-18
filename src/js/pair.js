$(function() {

  var FN_BASE_URL = 'https://us-central1-causal-shell-204520.cloudfunctions.net/';
  var PAIR_URL = FN_BASE_URL + 'pair';

  var uuid;

  chrome.storage.local.get(null, function(local) {
    uuid = local.uuid;
  });

  $('#configure-manually').click(function() {
    chrome.storage.local.set({
      openWindow: "setup"
    }, restart);
  });

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
        chrome.storage.local.set({
          paired_user_id: data.userId
        }, restart);
      },
      error: function(err) {
        Materialize.toast('Pairing error', 4000);
        console.error(err);
      },
    });
  });

  var restart = function() {
    if (chrome.runtime.restart) chrome.runtime.restart(); // for ChromeOS devices in "kiosk" mode
    chrome.runtime.reload();
  }
});