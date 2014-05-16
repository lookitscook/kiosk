chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {

  //don't let computer sleep
  chrome.power.requestKeepAwake("system");
  
  chrome.storage.local.get('url',function(x){
    if(('url' in x)){
      //setup has been completed
      openWindow("windows/browser.html");
    }else{
      //need to run setup
      openWindow("windows/setup.html");
    }
  });
  
  function openWindow(path){
    chrome.system.display.getInfo(function(d){
      chrome.app.window.create(path, {
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
  
}