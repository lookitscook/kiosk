$(function(){

  chrome.system.network.getNetworkInterfaces(function(interfaces) {
    for(var i in interfaces) {
      var interface = interfaces[i];
      var opt = document.createElement("option");
      opt.value = interface.address;
      opt.innerText = interface.name + " - " + interface.address;
      document.getElementById("host").appendChild(opt);
    }
  });

  $('#url').focus();

  $("#host").change(function(){
    if($("#host").val()){
      $('.admin').removeClass('disabled');
    }else{
      $('.admin').addClass('disabled');
    }
  });

  $('form').submit(function(e){
    e.preventDefault();
    var error = [];
    var url = $('#url').val();
    var host = $('#host').val();
    var port = parseInt($('#port').val());
    port = port < 0 ? 0 : port;
    var username = $("#username").val();
    var password = $("#password").val();
    var passwordConfirm = $("#confirm_password").val();
    if(url && (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 )){
      //url is valid
    }else{
      error.push("URL must be specified.");
    }
    if(host && (password != passwordConfirm)){
      error.push("Passwords must match.");
    }
    if(host && !port){
      error.push("Port must be specified.");
    }
    if(error.length){
      var h = "";
      for(var i = 0; i < error.length; i++){
        h += '<p>'+error[i]+'</p>';
      }
      $('#error').html(h);
      return false;
    }else{
      if(host && port){
        chrome.storage.local.set({'host':host});
        chrome.storage.local.set({'port':port});
        chrome.storage.local.set({'username':username});
        chrome.storage.local.set({'password':password});
      }
      chrome.storage.local.set({'url':url});
      chrome.runtime.reload();
    }
  });

  $('#demo').click(function(e){
    e.preventDefault();
    chrome.runtime.sendMessage('demo');
  });

});
