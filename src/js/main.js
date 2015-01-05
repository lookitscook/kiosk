chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {
  var win, basePath, socketInfo, data;
  var filesMap = {};

  //don't let computer sleep
  chrome.power.requestKeepAwake("display");

  chrome.storage.local.get(['url','host','port','username','password'],function(d){
    data = d;
    console.log(data);
    if(('url' in data)){
      //setup has been completed
      if(data['host'] && data['port']){
        startWebserver(data['host'],data['port'],'www');
      }
      openWindow("windows/browser.html");
    }else{
      //need to run setup
      openWindow("windows/setup.html");
    }
  });

  chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    if(request == "demo") openWindow("windows/demo.html");
  });

  function openWindow(path){
    if(win) win.close();
    chrome.system.display.getInfo(function(d){
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'browser',
        'state': 'fullscreen',
        'bounds':{
           'left':0,
           'top':0,
           'width':d[0].bounds.width,
           'height':d[0].bounds.height
        }
      },function(w){
        win = w;
        win.fullscreen();
        setTimeout(function(){
          win.fullscreen();
        },1000);
      });
    });
  }

  //directory must be a subdirectory of the package
  function startWebserver(host,port,directory){
    chrome.runtime.getPackageDirectoryEntry(function(packageDirectory){
      packageDirectory.getDirectory(directory,{create: false},function(webroot){

        basePath = webroot.fullPath;
        readDirectory(webroot);

        chrome.sockets.tcpServer.create({}, function(_socketInfo) {
          socketInfo = _socketInfo;
          chrome.sockets.tcpServer.listen(socketInfo.socketId, host, port, null, function(result){
            chrome.sockets.tcpServer.onAccept.addListener(onAccept);
            chrome.sockets.tcp.onReceive.addListener(onReceive);
          });
        });

      });
    });
  }

  var readDirectory = function(directory){
    var r = directory.createReader();
    r.readEntries(function(entries) {
      entries.forEach(function(entry, i) {
        if(entry.isDirectory)
          readDirectory(entry);
        else {
          entry.file(function(file){
            filesMap[entry.fullPath.replace(basePath,'')] = file;
          });
        }
      });
    });
  }

  var stringToUint8Array = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for(var i = 0; i < string.length; i++) {
      view[i] = string.charCodeAt(i);
    }
    return view;
  };

  var arrayBufferToString = function(buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for(var s = 0; s < uArrayVal.length; s++) {
      str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
  };

  var writeErrorResponse = function(socketId, errorCode, keepAlive) {
    var file = { size: 0 };
    var contentType = "text/plain"; //(file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 " + errorCode + "\nWWW-Authenticate: Basic\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);
    chrome.sockets.tcp.send(socketId, outputBuffer, function(writeInfo) {
      if (!keepAlive) {
        chrome.sockets.tcp.close(socketId);
      }
    });
  };

  var write200FileResponse = function(socketId, file, keepAlive) {
    var contentType = (file.type === "") ? "text/plain" : file.type;
    var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);

    var fileReader = new FileReader();
    fileReader.onload = function(e) {
      view.set(new Uint8Array(e.target.result), header.byteLength);
      chrome.sockets.tcp.send(socketId, outputBuffer, function(writeInfo) {
        if (!keepAlive) {
          chrome.sockets.tcp.close(socketId);
        }
      });
    };

    fileReader.readAsArrayBuffer(file);
  };

  var write200JSONResponse = function (socketId, json, keepAlive){
    var content = stringToUint8Array(json);
    var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + content.byteLength + "\nContent-type:text/json" + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + content.byteLength);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);
    view.set(content,header.byteLength);
    chrome.sockets.tcp.send(socketId, outputBuffer, function(writeInfo) {
      if (!keepAlive) {
        chrome.sockets.tcp.close(socketId);
      }
    });
  }

  var onAccept = function(info) {
    chrome.sockets.tcp.setPaused(info.clientSocketId,false);
  };

  var onReceive = function(info) {

    // parse the request.
    var request = arrayBufferToString(info.data);

    // check keep-alive
    var keepAlive = false;
    if (request.indexOf("Connection: keep-alive") != -1) {
      keepAlive = true;
    }

    // verify authorization
    var auth = request.indexOf("Authorization: Basic");
    if (auth >= 0){
      auth = request.substring(auth,request.indexOf('\n',auth)).split(' ');
      auth = window.atob(auth[auth.length-1]).split(':');
      if(auth.length == 2 && auth[0] == data["username"] && auth[1] == data["password"]){
        //request is authorized, continue
      }else{
        writeErrorResponse(info.socketId, "401 Not Authorized", keepAlive);
        return;
      }
    }else{
      writeErrorResponse(info.socketId, "401 Not Authorized", keepAlive);
      return;
    }

    // parse the request
    if(request.indexOf("PUT ") == 0){
      //REST request to set data
      var newData = request.split("\n\r");
      newData = newData[newData.length-1];
      newData = newData.trim().split('&');
      var saveData = {};
      for(var i = 0; i < newData.length; i++){
        var d = newData[i].split('=');
        var key = decodeURIComponent(d[0]);
        var value = decodeURIComponent(d[1]);
        if(data.hasOwnProperty(key)){
          data[key] = value;
          saveData[key] = value;
          if(key == "url"){
            chrome.runtime.sendMessage({url: value});
          }
        }
      }
      chrome.storage.local.set(saveData);
      write200JSONResponse(info.socketId, JSON.stringify(data), keepAlive);
    }else if(request.indexOf("GET ") == 0) {
      var uriEnd =  request.indexOf(" ", 4);
      if(uriEnd < 0) { /* throw a wobbler */ return; }
      var uri = request.substring(4, uriEnd);
      // strip query string
      var q = uri.indexOf("?");
      if (q != -1) {
        uri = uri.substring(0, q);
      }
      if(uri.substr(0,5) == '/data'){
        //this is a REST request for data
        write200JSONResponse(info.socketId, JSON.stringify(data), keepAlive);
      }else{
        //treat as a file request
        if(uri == "/") uri = "/index.html";
        var file = filesMap[uri];
        if(!!file == false) {
          console.warn("File does not exist..." + uri);
          writeErrorResponse(info.socketId, "404 Not Found", keepAlive);
          return;
        }
        write200FileResponse(info.socketId, file, keepAlive);
      }
    }else{
      // Throw an error
      chrome.sockets.tcp.close(info.socketId);
    }
  };

}
