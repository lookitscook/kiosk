$(function(){

  var RESTART_DELAY = 1000;

  var win = window;

  chrome.storage.local.get(null,function(data){
     var restarting = false;

     if(data.local){

       $(document).keydown(function(e) {
         if(e.which == 65 && e.ctrlKey)
           $('#login').openModal();
       });

       $('#submit').click(function(e){
         e.preventDefault();
         var username = $('#username').val();
         var password = $("#password").val();
         if(username == data.username && password == data.password){
           $('#login').closeModal();
           $('#username').val('');
           $("#password").val('');
           openWindow("windows/setup.html");
        }else{
          Materialize.toast('Invalid login.', 4000);
        }

       });

     }

     if(data.restart && parseInt(data.restart)){
       var hour = parseInt(data.restart) - 1;
       var now = moment();
       var restart = moment();
       restart.hour(hour);
       if(now.isAfter(restart)) restart.add(1,'d'); //if we're past the time today, do it tomorrow
       setInterval(function(){
          var now = moment();
          if(now.isAfter(reset)) chrome.runtime.reload();
        },60*1000);
     }

     if(data.reset && parseFloat(data.reset)){
       var reset = parseFloat(data.reset);
       var activeTimeout;

       active();

       $('*').on('click mousedown mouseup mousemove touch touchstart touchend keypress keydown',active);

       function active(){
         if(activeTimeout) clearTimeout(activeTimeout);
         activeTimeout = setTimeout(function(){
           $("#browser").remove();
           loadContent(data.url);
         },reset*60*1000);
       }

     }

     loadContent(data.url);

     function loadContent(url){
       $('<webview id="browser"/>')
        .css({
          width:'100%',
          height:'100%',
          position:'absolute',
          top:0,
          left:0,
          right:0,
          bottom:0
        })
        .attr('partition','persistant:kiosk')
        .on('exit',onEnded)
        .on('unresponsive',onEnded)
        .on('loadabort',onEnded)
        .attr('src',url)
        .prependTo('body');
     }

     function onEnded(event){
       if(!restarting){
         restarting = true;
         $("#browser").remove();
         setTimeout(function(){
           loadContent(data.url);
           restarting = false;
         },RESTART_DELAY);
      }
     }

  });

  chrome.runtime.onMessage.addListener(function(data){
    if(data.url && data.url != $("#browser").attr('src')){
      $("#browser").attr('src',data.url);
    }
  });

  function openWindow(path){
    chrome.system.display.getInfo(function(d){
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'setup',
        'state': 'fullscreen',
        'bounds':{
           'left':0,
           'top':0,
           'width':d[0].bounds.width,
           'height':d[0].bounds.height
        }
      },function(w){
        chrome.app.window.current().close();
        win = w;
        win.fullscreen();
        setTimeout(function(){
          win.fullscreen();
        },1000);
      });
    });
  }

});
