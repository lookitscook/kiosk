$(function(){

  chrome.socket.getNetworkList(function(interfaces) {
    for(var i in interfaces) {
      var interface = interfaces[i];
      var opt = document.createElement("option");
      opt.value = interface.address;
      opt.innerText = interface.name + " - " + interface.address;
      document.getElementById("host").appendChild(opt);
    }
  });

  $('#url').focus();

  $('form').submit(function(e){
    e.preventDefault();
    var url = $('#url').val();
    var host = $('#host').val();
    var port = parseInt($('#port').val());
    if(url && (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 )){
      if(host && port){
        chrome.storage.local.set({'host':host});
        chrome.storage.local.set({'port':port});
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
