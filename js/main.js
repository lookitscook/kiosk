chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {
  chrome.power.requestKeepAwake("system");
  chrome.system.display.getInfo(function(d){
    chrome.app.window.create("windows/browser.html", {
      'frame': 'none',
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