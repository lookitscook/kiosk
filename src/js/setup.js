$(function(){

  $("#reset").on('change',function(){
    if($("#reset").is(':checked')){
      $('.reset').hide().removeClass('disabled').slideDown();
    }else{
      $('.reset').slideUp();
    }
  });
  $("#restart").on('change',function(){
    if($("#restart").is(':checked')){
      $('.restart').hide().removeClass('disabled').slideDown();
    }else{
      $('.restart').slideUp();
    }
  });
  $("#local").on('change',function(){
    if($("#local").is(':checked')){
      $('.local').hide().removeClass('disabled').slideDown();
      if(!$("#remote").is(':checked')) $('.admin').hide().removeClass('disabled').slideDown();
    }else{
      $('.local').slideUp();
      if(!$("#remote").is(':checked')) $('.admin').slideUp();
    }
  });
  $("#remote").on('change',function(){
    if($("#remote").is(':checked')){
      $('.remote').hide().removeClass('disabled').slideDown();
      if(!$("#local").is(':checked')) $('.admin').hide().removeClass('disabled').slideDown();
    }else{
      $('.remote').slideUp();
      if(!$("#local").is(':checked')) $('.admin').slideUp();
    }
  });

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

  $('#save').click(function(e){
    e.preventDefault();
    var error = [];
    var url = $('#url').val();
    var host = $('#host').val();
    var remote = $("#remote").is(':checked');
    var local = $("#local").is(':checked');
    var reset = $("#reset").is(':checked');
    var restart = $("#restart").is(':checked');
    var port = parseInt($('#port').val());
    var reset = $("#reset").is(':checked');
    port = port < 0 ? 0 : port;
    var username = $("#username").val();
    var password = $("#password").val();
    var passwordConfirm = $("#confirm_password").val();
    if(reset){
      var reset = parseFloat($('#resetinterval').val());
      if(!reset) reset = 0;
      if(reset <= 0 ){
        reset = false;
        error.push("Reset interval is required.");
      }
    }
    if(url && (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 )){
      //url is valid
    }else{
      error.push("URL must be valid.");
    }
    if((remote || local)){
      if(!username){
        error.push("Username is required.");
      }
      if(!password){
        error.push("Password is required.")
      }else if(password != passwordConfirm){
        error.push("Passwords must match.");
      }
      if(remote){
        if(!port){
          error.push("Port is required.");
        }
        if(!host){
          error.push("Host is required.");
        }
      }
    }
    if(error.length){
      for(var i = 0; i < error.length; i++){
        toast(error[i], 4000);
      }
      return false;
    }else{
      chrome.storage.local.set({'local':local});
      chrome.storage.local.set({'remote':remote});
      if(local || remote){
        if(remote){
          chrome.storage.local.set({'host':host});
          chrome.storage.local.set({'port':port});
        }
        chrome.storage.local.set({'username':username});
        chrome.storage.local.set({'password':password});
      }
      if(reset){
        chrome.storage.local.set({'reset':reset});
      }
      if(restart){
        restart = parseInt($('#hour').val())+parseInt($('#houroffset').val());
        chrome.storage.local.set({'restart':restart});
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
