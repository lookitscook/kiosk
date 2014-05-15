$(function(){

  var display;
  
  $('#password').focus();
  
  chrome.system.display.getInfo(function(d){
    display = d[0].bounds;
    $('#cancel').click(function(e){
      e.preventDefault();
      window.close();
    });
    $('form').submit(function(e){
      e.preventDefault();
      chrome.storage.local.get('password',function(x){
        if(x['password'] == $('#password').val()){
          window.close();
          openOptionsWindow();
        }else{
          //passwords don't match
        }
      });
    });
  });
  
  function openOptionsWindow(){
    var w = display.width*0.5;
    var h = 200;
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