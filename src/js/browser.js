$(function(){

  var display;
  
  chrome.storage.local.get('url',function(x){
     $('#browser').attr('src',x["url"]).get(0).reload();
  });

});