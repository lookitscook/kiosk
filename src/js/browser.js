$(function(){

  var RESTART_DELAY = 1000;

  var win = window;
  var activeTimeout;
  var restart;

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
       restart = moment();
       restart.hour(hour).set({'minute':0, 'second':0, 'millisecond':0});
       if(now.isAfter(restart)) restart.add(1,'d'); //if we're past the time today, do it tomorrow
       setInterval(function(){
          var now = moment();
          if(now.isAfter(restart)) chrome.runtime.reload();
        },60*1000);
     }

     if(data.remoteschedule && data.remotescheduleurl){
       $.getJSON(data.remotescheduleurl, function( schedule ) {
         console.log( "schedule loaded" , schedule);
       });
     }

     var reset = data.reset && parseFloat(data.reset) > 0 ? parseFloat(data.reset) : false;

     active();

     $('*').on('click mousedown mouseup mousemove touch touchstart touchend keypress keydown',active);

     function active(){

       if(reset){
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
        .on('loadabort',function(e){if(e.isTopLevel) onEnded(e); })
        .on('consolemessage',function(e){
          if(e.originalEvent.message == 'kiosk:active') active();
        })
        .on('permissionrequest',function(e){
          if(e.originalEvent.permission === 'media') {
            e.preventDefault();
            chrome.permissions.contains({
              permissions: ['audioCapture','videoCapture']
            }, function(result) {
              if (result) {
                // The app has the permissions.
                e.originalEvent.request.allow();
              } else {
                // The app doesn't have the permissions.
                // request it
                $('#mediaPermission .ok').click(function(){
                  chrome.permissions.request({
                    permissions: ['audioCapture','videoCapture']
                  },function(granted){
                    if(granted) e.originalEvent.request.allow();
                  });
                });
                $('#mediaPermission').openModal();
              }
            });
          }
        })
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
