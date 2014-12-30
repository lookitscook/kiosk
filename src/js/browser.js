$(function(){

  var display;

  chrome.storage.local.get('url',function(data){
     var restarting = false;
     $('#browser').on('loadabort',function(e){
       if(e.originalEvent.isTopLevel && !restarting){
         restarting = true;
         setTimeout(function(){
           restarting = false;
           $('#browser').get(0).reload();
         },1000);
       }
     }).attr('src',data["url"]).get(0).reload();
  });

});
