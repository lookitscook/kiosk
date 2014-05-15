$(function(){

  var display;
  
  chrome.storage.local.get('url',function(x){
     $('#browser').attr('src',x["url"]).get(0).reload();
  });
  
  chrome.system.display.getInfo(function(d){
    display = d[0].bounds;
    $(document).on("keypress", function(e) {
      /* ctrl + shift + 0 is the combo to open login prompt */
      if(e.ctrlKey && e.shiftKey && e.which == 48){
        openLoginWindow();
      }
    });
  });
  
  function openLoginWindow(){
    console.log("open window");
    var w = 320;
    var h = 40;
    var t = display.height/2-h/2;
    var l = display.width/2-w/2;
    chrome.app.window.create("windows/login.html", {
      'frame': 'none',
      'id': 'login',
      'resizable':false,
      'bounds':{
         'left':l,
         'top':t,
         'width':w,
         'height':h
      }
    },function(w){
      w.setAlwaysOnTop(true);
    });
  }
  
});