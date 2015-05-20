$(function(){

  var RESTART_DELAY = 1000;

  chrome.storage.local.get('url',function(data){
     var restarting = false;

     loadContent(data["url"]);

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
           loadContent(data["url"]);
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

});
