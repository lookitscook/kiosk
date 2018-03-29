const DEFAULT_PORT = 8080;

function validIpAddress(ipaddress) {  
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
    return true; 
  }  
  return false;
}  

$(function() {
  var win, basePath, socketInfo, data;
  var filesMap = {};
  
  chrome.system.network.getNetworkInterfaces(function(interfaces) {
    for(var i in interfaces) {
      var interface = interfaces[i];
      if (validIpAddress(interface.address) && interface.name.startsWith("wl")){
        $("#settings-url").append(interface.address + ":" + DEFAULT_PORT);
        console.log(interface.address + ":" + DEFAULT_PORT)
      }
    }
  });
});