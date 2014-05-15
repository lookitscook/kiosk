$(function(){

  var url;

  $('#url').focus();
  
  $('#cancel').click(function(e){
    e.preventDefault();
    window.close();
  });

  chrome.storage.local.get('url',function(x){
    url = x["url"];
    $('#url').val(url);
    $('form').submit(function(e){
      e.preventDefault();
      if($('#url').val() != url){
        chrome.storage.local.set({'url':$('#url').val()});
      }
      if($('#password').val().length){
        if($('#password').val() == $('#password_repeat').val()){
          chrome.storage.local.set({'password':$('#password').val()});
        }else{
          //passwords don't match
          return;
        }
      }
      chrome.runtime.reload();
    });
    
  });
  
});