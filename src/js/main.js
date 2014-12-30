chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {
  var win, basePath, socketInfo;
  var socket = chrome.socket;
  var filesMap = {};

  //don't let computer sleep
  chrome.power.requestKeepAwake("display");

  chrome.storage.local.get(['url','host','port'],function(data){
    if(('url' in data)){
      //setup has been completed
      console.log("setup completed");
      if(data['host'] && data['port']){
        console.log("starting webserver");
        startWebserver(data['host'],data['port'],'www');
      }
      openWindow("windows/browser.html");
    }else{
      //need to run setup
      openWindow("www/setup.html");
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

        socket.create("tcp", {}, function(_socketInfo) {
          socketInfo = _socketInfo;
          socket.listen(socketInfo.socketId, host, port, 50, function(result) {
            socket.accept(socketInfo.socketId, onAccept);
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

  var logToScreen = function(log) {
    console.log(log);
  }

  var writeErrorResponse = function(socketId, errorCode, keepAlive) {
    var file = { size: 0 };
    console.info("writeErrorResponse:: begin... ");
    console.info("writeErrorResponse:: file = " + file);
    var contentType = "text/plain"; //(file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 " + errorCode + " Not Found\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    console.info("writeErrorResponse:: Done setting header...");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);
    console.info("writeErrorResponse:: Done setting view...");
    socket.write(socketId, outputBuffer, function(writeInfo) {
      console.log("WRITE", writeInfo);
      if (keepAlive) {
        readFromSocket(socketId);
      } else {
        socket.destroy(socketId);
        socket.accept(socketInfo.socketId, onAccept);
      }
    });
    console.info("writeErrorResponse::filereader:: end onload...");

    console.info("writeErrorResponse:: end...");
  };

  var write200Response = function(socketId, file, keepAlive) {
    var contentType = (file.type === "") ? "text/plain" : file.type;
    var contentLength = file.size;
    var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + file.size + "\nContent-type:" + contentType + ( keepAlive ? "\nConnection: keep-alive" : "") + "\n\n");
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer)
    view.set(header, 0);

    var fileReader = new FileReader();
    fileReader.onload = function(e) {
      view.set(new Uint8Array(e.target.result), header.byteLength);
      socket.write(socketId, outputBuffer, function(writeInfo) {
        console.log("WRITE", writeInfo);
        if (keepAlive) {
          readFromSocket(socketId);
        } else {
          socket.destroy(socketId);
          socket.accept(socketInfo.socketId, onAccept);
        }
      });
    };

    fileReader.readAsArrayBuffer(file);
  };

  var onAccept = function(acceptInfo) {
    console.log("ACCEPT", acceptInfo)
    readFromSocket(acceptInfo.socketId);
  };

  var readFromSocket = function(socketId) {
    //  Read in the data
    socket.read(socketId, function(readInfo) {
      console.log("READ", readInfo);
      // Parse the request.
      var data = arrayBufferToString(readInfo.data);
      if(data.indexOf("GET ") == 0) {
        var keepAlive = false;
        if (data.indexOf("Connection: keep-alive") != -1) {
          keepAlive = true;
        }

        // we can only deal with GET requests
        var uriEnd =  data.indexOf(" ", 4);
        if(uriEnd < 0) { /* throw a wobbler */ return; }
        var uri = data.substring(4, uriEnd);
        // strip qyery string
        var q = uri.indexOf("?");
        if (q != -1) {
          uri = uri.substring(0, q);
        }

        var file = filesMap[uri];
        if(!!file == false) {
          console.warn("File does not exist..." + uri);
          writeErrorResponse(socketId, 404, keepAlive);
          return;
        }
        logToScreen("GET 200 " + uri);
        write200Response(socketId, file, keepAlive);
      }
      else {
        // Throw an error
        socket.destroy(socketId);
      }
    });
  };

}
