var system = {};

system.restart = function(){
    if(chrome.runtime.restart) {
        chrome.runtime.restart();
    }
    chrome.runtime.reload();
};

system.getSchemaUrl = function(){
    return chrome.runtime.getURL("../schema.json");
}

system.onCommand = function(handler){
    chrome.commands.onCommand.addListener(handler);
}