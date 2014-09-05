$(function(){

  $('#url').focus();
 
  $('form').submit(function(e){
    e.preventDefault();
    var url = $('#url').val();
    if(url && (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 )){
      chrome.storage.local.set({'url':$('#url').val()});
      chrome.runtime.reload();
    }
  });

  $('#demo').click(function(e){
    e.preventDefault();
    chrome.runtime.sendMessage('demo');
  }); 

});
