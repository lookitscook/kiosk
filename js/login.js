$(function(){

  var display;
  
  chrome.system.display.getInfo(function(d){
    display = d[0].bounds;
    $('#cancel').click(function(e){
      e.preventDefault();
      window.close();
    });
  });
  
  function openOptionsWindow(){
    var w = display.height*0.75;
    var h = display.height*0.75;
    var t = display.height/2-h/2;
    var l = display.width/2-w/2;
    chrome.app.window.create("windows/options.html", {
      'id': 'options',
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