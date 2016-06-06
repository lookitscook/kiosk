var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes

$(function(){
  chrome.storage.local.get(null,function(data){
    chrome.system.network.getNetworkInterfaces(function(interfaces) {


  for(var i in interfaces) {
    var interface = interfaces[i];
    var opt = document.createElement("option");
    opt.value = interface.address;
    opt.innerText = interface.name + " - " + interface.address;
    document.getElementById("host").appendChild(opt);
  }

  if(data.url) $('#url').val(data.url).siblings('label').addClass('active');
  if(data.local) {
    $("#local").prop("checked",true);
    $('.local, .settings-detail').removeClass('disabled');
  }
  if(data.remote) {
    $("#remote").prop("checked",true);
    $('.remote, .settings-detail').removeClass('disabled');
  }
  if(data.username) $("#username").val(data.username).siblings('label').addClass('active');
  if(data.password) {
    $("#password").val(data.password).siblings('label').addClass('active');
    $("#confirm_password").val(data.password).siblings('label').addClass('active');
  }
  if(data.host){
    $('#host').children("[value='"+data.host+"']").prop('selected',true);
  }
  if(data.port) $("#port").val(data.port);

  if(data.remoteschedule){
    $("#remote-schedule").prop("checked",true);
    $('.remote-schedule-detail').removeClass('disabled');
  }
  if(data.remotescheduleurl)
    $("#remote-schedule-url").val(data.remotescheduleurl).siblings('label').addClass('active');

  if(data.schedulepollinterval){
   $('#schedule-poll-interval').val(data.schedulepollinterval);
  }

  if(data.sleepmode){
   $('#sleep-mode').children("[value='"+data.sleepmode+"']").prop('selected',true);
  }

  if(data.reset && parseFloat(data.reset)){
    var reset = parseFloat(data.reset);
    $("#reset").prop("checked",true);
    $('.reset').removeClass('disabled');
    $("#resetinterval").val(data.reset).siblings('label').addClass('active');
  }
  if(data.restart && parseInt(data.restart)){
    var restart = parseInt(data.restart);
    $('#houroffset > option').removeAttr('selected');
    if(restart > 12) {
      restart = restart - 12;
      $("#houroffset option:contains('PM')").prop('selected',true);
    }else{
      $("#houroffset option:contains('AM')").prop('selected',true);
    }
    $("#restart").prop("checked",true);
    $('.restart').removeClass('disabled');
    $('#hour option').removeAttr('selected');
    $("#hour option[value="+restart+"]").prop('selected',true);
    $("#hour").siblings('label').addClass('active');
  }
  if(data.hidecursor) $("#hidecursor").prop("checked",true);
  if(data.disablecontextmenu) $("#disablecontextmenu").prop("checked",true);
  if(data.disabledrag) $("#disabledrag").prop("checked",true);
  if(data.disabletouchhighlight) $("#disabletouchhighlight").prop("checked",true);
  if(data.disableselection) $("#disableselection").prop("checked",true);
  if(data.servelocaldirectory){
    var servelocaldirectoryname = data.servelocaldirectory.split(':');
    servelocaldirectoryname = (servelocaldirectoryname.length == 2) ? servelocaldirectoryname[1] : null;
    if(servelocaldirectoryname){
      $("#servelocal").prop("checked",true);
      $('.servelocal').removeClass('disabled');
      $("#servelocaldirectory").data('directory',data.servelocaldirectory);
      $("#servelocaldirectory").attr('value',servelocaldirectoryname);
    }
  }
  if(data.servelocalhost){
    $('#servelocalhost').children("[value='"+data.servelocalhost+"']").prop('selected',true);
  }
  if(data.servelocalport) $("#servelocalport").val(data.servelocalport);
  if(data.useragent) $('#useragent').val(data.useragent).siblings('label').addClass('active');

  $('select').material_select();

  $("#servelocal").on('change',function(){
    if($("#servelocal").is(':checked')){
      $('.servelocal').hide().removeClass('disabled').slideDown();
      if(!$("#servelocaldirectory").attr('value')) selectLocalDirectory();
    }else{
      $('.servelocal').slideUp();
    }
  });
  $('#changelocaldirectory').on('click',function(){
    selectLocalDirectory();
  });
  function selectLocalDirectory(){
    chrome.fileSystem.chooseEntry({
      type: "openDirectory"
    },function(entry,fileEntries){
      var id = chrome.fileSystem.retainEntry(entry);
      chrome.fileSystem.isRestorable(id,function(isRestorable){
        if(isRestorable){
          $("#servelocaldirectory").data('directory',id);
          $("#servelocaldirectory").attr('value',entry.name);
        }else{
          Materialize.toast("Permission denied to restore directory '"+entry.name+"'.", 4000);
        }
      });
    });
  }

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
      if(!$("#remote").is(':checked')) $('.settings-detail').hide().removeClass('disabled').slideDown();
    }else{
      $('.local').slideUp();
      if(!$("#remote").is(':checked')) $('.settings-detail').slideUp();
    }
  });
  $("#remote").on('change',function(){
    if($("#remote").is(':checked')){
      $('.remote').hide().removeClass('disabled').slideDown();
      if(!$("#local").is(':checked')) $('.settings-detail').hide().removeClass('disabled').slideDown();
    }else{
      $('.remote').slideUp();
      if(!$("#local").is(':checked')) $('.settings-detail').slideUp();
    }
  });

  $("#remote-schedule").on('change',function(){
    if($("#remote-schedule").is(':checked')){
      $('.remote-schedule-detail').hide().removeClass('disabled').slideDown();
    }else{
      $('.remote-schedule-detail').slideUp();
    }
  });

  $("#servelocal,#servelocalport").on('change',setLocalContentURL);

  function setLocalContentURL(){
    if($("#servelocal").is(':checked')){
      $('#url').val('http://127.0.0.1:'+$('#servelocalport').val()+'/').siblings('label').addClass('active');
    }else{
      $('#url').val('').siblings('label').removeClass('active');
    }
  }

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
    var hidecursor = $("#hidecursor").is(':checked');
    var disablecontextmenu = $("#disablecontextmenu").is(':checked');
    var disabledrag = $("#disabledrag").is(':checked');
    var disabletouchhighlight = $("#disabletouchhighlight").is(':checked');
    var disableselection = $("#disableselection").is(':checked');
    var useragent = $('#useragent').val();
    port = port < 0 ? 0 : port;
    var username = $("#username").val();
    var password = $("#password").val();
    var passwordConfirm = $("#confirm_password").val();
    var remoteschedule = $("#remote-schedule").is(':checked');
    var remotescheduleurl = $("#remote-schedule-url").val();
    var schedulepollinterval = parseFloat($('#schedule-poll-interval').val()) ? parseFloat($('#schedule-poll-interval').val()) : DEFAULT_SCHEDULE_POLL_INTERVAL;
    var sleepmode = $("#sleep-mode").val();
    var resetcache = $('#reset-cache').is(':checked');

    var servelocal = $("#servelocal").is(':checked');
    var servelocaldirectory = $('#servelocaldirectory').data('directory');
    var servelocalhost = $('#servelocalhost').val();
    var servelocalport = parseInt($('#servelocalport').val());
    servelocalport = servelocalport < 0 ? 0 : servelocalport;

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
      error.push("Content URL must be valid.");
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
        }else if(port < 1024){
           error.push("Remote admin. port must be above 1024");
        }
        if(!host){
          error.push("Host is required.");
        }
      }
    }
    if(remoteschedule){
      if(remotescheduleurl && (remotescheduleurl.indexOf("http://") >= 0 || remotescheduleurl.indexOf("https://") >= 0 )){
        //url is valid
        if(schedulepollinterval <= 0 ){
          schedulepollinterval = false;
          error.push("Schedule Poll Interval must be greater then 0.");
        }
      }else{
        schedulepollinterval = false;
        error.push("Schedule URL must be valid.");
      }
    }else{
      schedulepollinterval = false;
    }

    if(servelocal){
        if(!servelocaldirectory) error.push("Directory is required for serving local files.");
        if(!servelocalhost) error.push("Host is required for serving local files.");
        if(!servelocalport) error.push("Port is required for serving local files.");
        else if(servelocalport < 1024) error.push("Local port must be above 1024");
    }
    if(error.length){
      for(var i = 0; i < error.length; i++){
        Materialize.toast(error[i], 4000);
      }
      return false;
    }else{
      if(local) chrome.storage.local.set({'local':local});
      else chrome.storage.local.remove('local');
      if(remote) chrome.storage.local.set({'remote':remote});
      else chrome.storage.local.remove('remote');
      if(local || remote){
        if(remote){
          chrome.storage.local.set({'host':host});
          chrome.storage.local.set({'port':port});
        }
        chrome.storage.local.set({'username':username});
        chrome.storage.local.set({'password':password});
      }
      if(reset) chrome.storage.local.set({'reset':reset});
      else chrome.storage.local.remove('reset');
      if(restart){
        restart = parseInt($('#hour').val())+parseInt($('#houroffset').val());
        chrome.storage.local.set({'restart':restart});
      }else{
        chrome.storage.local.remove('restart');
      }
      if(remoteschedule) chrome.storage.local.set({'remoteschedule':remoteschedule});
      else chrome.storage.local.remove('remoteschedule');
      if(remotescheduleurl) chrome.storage.local.set({'remotescheduleurl':remotescheduleurl});
      else chrome.storage.local.remove('remotescheduleurl');
      if(schedulepollinterval) chrome.storage.local.set({'schedulepollinterval':schedulepollinterval});
      else chrome.storage.local.remove('schedulepollinterval');
      if(hidecursor) chrome.storage.local.set({'hidecursor':hidecursor});
      else chrome.storage.local.remove('hidecursor');
      if(disablecontextmenu) chrome.storage.local.set({'disablecontextmenu':disablecontextmenu});
      else chrome.storage.local.remove('disablecontextmenu');
      if(disabledrag) chrome.storage.local.set({'disabledrag':disabledrag});
      else chrome.storage.local.remove('disabledrag');
      if(disabletouchhighlight) chrome.storage.local.set({'disabletouchhighlight':disabletouchhighlight});
      else chrome.storage.local.remove('disabletouchhighlight');
      if(disableselection) chrome.storage.local.set({'disableselection':disableselection});
      else chrome.storage.local.remove('disableselection');
      if(servelocal){
        chrome.storage.local.set({'servelocaldirectory':servelocaldirectory});
        chrome.storage.local.set({'servelocalhost':servelocalhost});
        chrome.storage.local.set({'servelocalport':servelocalport});
      }else{
        chrome.storage.local.remove('servelocaldirectory');
        chrome.storage.local.remove('servelocalhost');
        chrome.storage.local.remove('servelocalport');
      }
      if(resetcache) chrome.storage.local.set({'resetcache': resetcache});
      else chrome.storage.local.remove('resetcache');
      chrome.storage.local.set({'url':url});
      chrome.storage.local.set({'useragent':useragent});
      chrome.storage.local.set({'sleepmode':sleepmode});
      chrome.runtime.sendMessage('reload');
    }
  });

  $('#demo').click(function(e){
    e.preventDefault();
    chrome.runtime.sendMessage('demo');
  });


    });
  });
});
