var KEY_PREFIX = "KIOSK-";
var system = {};

system.setLocalStorage = function(data, cb){
    if(chrome && chrome.storage && chrome.storage.local){
        chrome.storage.local.set(data, cb); 
        return;
    }
    for(var key in data){
        localStorage.setItem(KEY_PREFIX+key, JSON.stringify(data[key]));
    }
    if(cb) {
        cb();
    }
}

system.getLocalStorage = function(cb){
    var result = {};
    if(chrome && chrome.storage && chrome.storage.local){
        chrome.storage.local.get(null, cb);
        return;
    }
    var allKeys = Object.keys(localStorage);
    var keys = [];
    allKeys.forEach(function(key){
        if(key.indexOf(KEY_PREFIX) == 0){
            keys.push(key);
        }
    });
    if(keys){
        keys.forEach(function(key){
            result[key.substr(KEY_PREFIX.length)] = JSON.parse(localStorage.getItem(key));
        });
    }
    if(cb) { 
        cb(result);
    }
    return result;
}

system.removeLocalStorage = function(keys, cb){
    if(chrome && chrome.storage && chrome.storage.local){
        chrome.storage.local.remove(keys, cb);
        return;
    }
    keys.forEach(function(key){
        localStorage.removeItem(KEY_PREFIX+key);
    });
    if(cb){
        cb();
    }
}

system.restart = function(){
    if(chrome && chrome.runtime){
        if(chrome.runtime.restart) {
            chrome.runtime.restart();
        }
        chrome.runtime.reload();
        return;
    }
    window.location = '/';
};

system.getSchemaUrl = function(){
    var relativePath = "../schema.json";
    if(chrome && chrome.runtime){
        return chrome.runtime.getURL(relativePath);
    }
    return relativePath;
}

system.exitApplication = function(){
    if(chrome && chrome.app && chrome.app.window){
        chrome.app.window.current().close();
        return;
    }
    window.close();
}

system.downloadFile = function(filename, text){
    var mimetype = "text/plain";
    if(chrome && chrome.fileSystem){
        chrome.fileSystem.chooseEntry({
            type: 'saveFile',
            suggestedName: filename
            }, function(writableFileEntry) {
            writableFileEntry.createWriter(function(writer) {
                writer.onerror = errorHandler;
                writer.write(new Blob([text], {
                type: mimetype
                }));
            }, errorHandler);
        });
    }
    browser.downloads.download({
        url: "data:"+mimetype+','+text,
        filename: filename
    });
}
