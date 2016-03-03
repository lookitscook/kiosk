function AdminDataHandler(request) {
  WSC.BaseHandler.prototype.constructor.call(this)
}
_.extend(AdminDataHandler.prototype, {
  put: function() {

    var newData = this.request.bodyparams

    chrome.storage.local.get(null, function(data) {

      var saveData = {}
      var restart = false;
      for(var key in newData){
        var value = newData[key]
        if(data.hasOwnProperty(key)){
          data[key] = value;
          saveData[key] = value;
          if(key == "url"){
            chrome.runtime.sendMessage({url: value});
          }
        }else if(key == "restart"){
          restart = true;
        }
      }
      chrome.storage.local.set(saveData);
      this.setHeader('content-type','text/json')
      var buf = new TextEncoder('utf-8').encode(JSON.stringify(data)).buffer
      this.write(buf)
      this.finish()

      if(restart) setTimeout( function() {
        // allow writing out response first.
        chrome.runtime.sendMessage('reload');
      }, 1000 )
                              
      
    }.bind(this))

  },
  get: function() {
    chrome.storage.local.get(null, function(data) {
      this.setHeader('content-type','text/json')
      var buf = new TextEncoder('utf-8').encode(JSON.stringify(data)).buffer
      this.write(buf)
      this.finish()
    }.bind(this))
  }
}, WSC.BaseHandler.prototype)
