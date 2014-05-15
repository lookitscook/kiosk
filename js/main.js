chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

var DEFAULT_PASSWORD = 'admin';
var DEFAULT_URL = 'http://www.google.com';

function init() {

  //don't let computer sleep
  chrome.power.requestKeepAwake("system");
  
  //set defaults
  chrome.storage.local.get(['password','url'],function(x){
    if(!('password' in x)) chrome.storage.local.set({'password':DEFAULT_PASSWORD});
    if(!('url' in x)) chrome.storage.local.set({'url':DEFAULT_URL});
  });
  
  //open main content window
  chrome.system.display.getInfo(function(d){
    chrome.app.window.create("windows/browser.html", {
      'frame': 'none',
      'id': 'browser',
      'bounds':{
         'left':0,
         'top':0,
         'width':d[0].bounds.width,
         'height':d[0].bounds.height
      }
    },function(w){
      w.fullscreen();
    });
  });
}