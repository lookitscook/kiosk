chrome.app.runtime.onLaunched.addListener(init);
chrome.app.runtime.onRestarted.addListener(init);

function init() {
  chrome.power.requestKeepAwake("system");
  chrome.system.display.getInfo(function(d){
    openWindow('browser.html',0,0,d[0].bounds.width,d[0].bounds.height);
  });
}

function openWindow(file,top,left,width,height){
  chrome.app.window.create(file, {
    'minWidth':width,
    'minHeight':height,
    'frame': 'none',
    'bounds':{
       'left':top,
       'top':left,
       'width':width,
       'height':height
    }
  },function(newWindow){
    newWindow.setBounds({
        'left':left,
        'top':top,
        'width':width,
        'height':height
    });
  });
}