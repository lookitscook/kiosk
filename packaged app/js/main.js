chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {
  var win;

  //don't let computer sleep
  chrome.power.requestKeepAwake("display");
  
  chrome.storage.local.get('url',function(x){
    if(('url' in x)){
      //setup has been completed
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
  
}
