$(function(){

  $("#host").on('change',hostChanged);

  chrome.system.network.getNetworkInterfaces(function(interfaces) {
    for(var i in interfaces) {
      var interface = interfaces[i];
      var opt = document.createElement("option");
      opt.value = interface.address;
      opt.innerText = interface.name + " - " + interface.address;
      document.getElementById("host").appendChild(opt);
    }
    $('select').material_select();
  });

  $('#url').focus();

  function hostChanged(){
    if($("#host").val()){
      $('.admin').removeClass('disabled');
    }else{
      $('.admin').addClass('disabled');
    }
  }

  $('#save').click(function(e){
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
      error.push("URL must be valid.");
    }
    if(host && !username){
      error.push("Username is required");
    }
    if(host && !password){
      error.push("Password is required.")
    }else if(host && (password != passwordConfirm)){
      error.push("Passwords must match.");
    }
    if(host && !port){
      error.push("Port must be specified.");
    }
    if(error.length){
      for(var i = 0; i < error.length; i++){
        toast(error[i], 4000);
      }
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
