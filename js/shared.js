var FN_BASE_URL = 'https://us-central1-causal-shell-204520.cloudfunctions.net/';
var CHECK_IN_URL = FN_BASE_URL + 'check_in';
var CHECK_IN_DUE = 1000 * 60 * 60 * 24 * 14; // check in due every 14 days, in ms

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
      Object.assign(newConfig, {
        paired_user_configuration: newConfigId,
      });
      return cb(null, newConfig);
    }
    return cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
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