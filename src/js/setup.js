var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes

	function renderDisplayTemplate(display, id, isPrimary){
		var scale = 0.09,
		offsetX = 130,
		offsetY = 0;
		var info = currentDisplay.bounds;
		
		var $template = $('<div class="display-entry" style="padding-left:10px" title="Please select display to use."><div class="display-meta"></div></div>');
			$template.css({
				top: info.top*scale + offsetY,
				left: info.left*scale + offsetX,
				width: info.width*scale,
				height: info.height*scale
			}).data($.extend({id:id},display));

			$template.find('.display-meta').text(info.width + 'x' + info.height);

		if(isPrimary){
			$template.addClass('selected');
		}

		return $template;
	}

	function displaySetup() {
	 	chrome.system.display.getInfo(function(displayInfo) {
			var $el;
			$el = $('#display-setting-layer');
			$el.empty();
			for(var i=0; i<displayInfo.length; i++) {
				currentDisplay = displayInfo[i];
				template = renderDisplayTemplate(currentDisplay, i, currentDisplay.isPrimary);
				$el.append(template);
			}
		});
	}
	
$(function() {
 displaySetup();
 chrome.system.display.onDisplayChanged.addListener(displaySetup);
});

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
    $("#hour option:contains('"+restart+":00')").prop('selected',true);
    $("#hour").siblings('label').addClass('active');
  }
  if(data.hidecursor) $("#hidecursor").prop("checked",true);
  if(data.disablecontextmenu) $("#disablecontextmenu").prop("checked",true);
  if(data.disabledrag) $("#disabledrag").prop("checked",true);
  if(data.disabletouchhighlight) $("#disabletouchhighlight").prop("checked",true);
  if(data.disableselection) $("#disableselection").prop("checked",true);

  $('select').material_select();

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
    port = port < 0 ? 0 : port;
    var username = $("#username").val();
    var password = $("#password").val();
    var passwordConfirm = $("#confirm_password").val();
    var remoteschedule = $("#remote-schedule").is(':checked');
    var remotescheduleurl = $("#remote-schedule-url").val();
    var schedulepollinterval = parseFloat($('#schedule-poll-interval').val()) ? parseFloat($('#schedule-poll-interval').val()) : DEFAULT_SCHEDULE_POLL_INTERVAL;
	
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
    }
    else{
      schedulepollinterval = false;
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
	  display = $('.display-entry.selected').data();
	  chrome.storage.local.set({'display':display});
      chrome.storage.local.set({'url':url});
      chrome.runtime.reload();
    }
  });
				  
  $('#demo').click(function(e){
    e.preventDefault();
    chrome.runtime.sendMessage('demo');
  });

  $('.display-entry').click(function(e){
    $target = $(e.target); 
    $target.parent().find('.display-entry').removeClass('selected');	
    $target.addClass('selected');
  });
  
  
    });
  });			  

	   chrome.system.display.getInfo(function(displayInfo) {
	var w = 0;var h = 0;
  });
  
});

