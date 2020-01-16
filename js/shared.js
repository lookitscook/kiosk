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