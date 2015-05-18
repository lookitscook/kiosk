$(function(){

  var RESTART_DELAY = 1000;
  var display;

  $(document).keydown(function(e) {
    if(e.which == 65 && e.ctrlKey)
      $('#admin').openModal();
  });

  chrome.storage.local.get('url',function(data){
     var restarting = false;

     $('#browser').on('exit',function(e){ restart(); });
     $('#browser').on('unresponsive',function(e){ if(e.originalEvent.isTopLevel) restart(); });
     $('#browser')
      .on('loadabort',function(e){ if(e.originalEvent.isTopLevel) restart(); })
      .attr('src',data["url"]).get(0).reload();

     function restart(){
       if(!restarting){ 
         restarting = true;
         setTimeout(function(){
           restarting = false;
           $('#browser').attr('src',data["url"]).get(0).reload();
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
