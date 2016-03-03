$(function(){

  var RESTART_DELAY = 1000;
  var CHECK_SCHEDULE_DELAY = 30 * 1000; //check content against schedule every 30 seconds
  var DEFAULT_SCHEDULE_POLL_INTERVAL = 15; //minutes

  var restarting = false;
  var reset = false;
  var win = window;
  var activeTimeout;
  var restart;
  var schedule,scheduleURL,defaultURL,currentURL,updateScheduleTimeout,checkScheduleTimeout,schedulepollinterval;
  var hidecursor = false;
  var disablecontextmenu = false;
  var disabledrag = false;
  var disabletouchhighlight = false;
  var disableselection = false;
  var useragent = '';
  var resetcache = false;

  //prevent existing fullscreen on escape key press
  window.onkeydown = window.onkeyup = function(e) { if (e.keyCode == 27) { e.preventDefault(); } };

  function updateSchedule(){
    $.getJSON(scheduleURL, function(s) {
      if(s && s.schedule && s.schedule.Value && s.schedule.Value.length){
        //support schedule.Value as structure or array containing structure
        s.schedule.Value = s.schedule.Value[0];
      }
      if(s && s.schedule && s.schedule.Value && s.schedule.Value.items && s.schedule.Value.items.length){
        var s = s.schedule.Value.items;
        for(var i = 0; i < s.length; i++){
          if(s[i].content && s[i].start && s[i].end){
            s[i].start = new Date(Date.parse(s[i].start));
            s[i].end = new Date(Date.parse(s[i].end));
            s[i].duration = (s[i].end - s[i].start) / 1000; //duration is in seconds
          }else{
            //item did not include start, end, or content: invalid
            s = s.splice(i--, 1);
          }
        }
        schedule = s;
        checkSchedule();
      }
    });
  }

  function checkSchedule(){
    var s = schedule;
    var scheduledContent = [];
    if(s && s.length){
      var now = Date.now();
      var hasScheduledContent = false;
      for(var i = 0; i < s.length; i++){
        if(now >= s[i].start && now < s[i].end){
          hasScheduledContent = true;
          scheduledContent.push(s[i]);
      }
    }

    if(hasScheduledContent){
       //find the latest start time
       scheduledContent.sort(function(a,b){
         if(a.start == b.start ) return a;
         return b.start - a.start;
       });

       //first in the list has the latest start time
       //only on a change do we want to load
       if(scheduledContent[0].content != currentURL){
          currentURL = scheduledContent[0].content;
          $("#browser").remove();
          loadContent();
       }
    }
    else if(!hasScheduledContent && currentURL != defaultURL){
        currentURL = defaultURL;
        $("#browser").remove();
        loadContent();
    }
   }
 }

  chrome.storage.local.get(null,function(data){
     if(data.local){
       $(document).keydown(function(e) {
         if(e.which == 65 && e.ctrlKey)
           $('#login').openModal();
       });

       $('#submit').click(function(e){
         e.preventDefault();
         var username = $('#username').val();
         var password = $("#password").val();
         if(username == data.username && password == data.password){
           $('#login').closeModal();
           $('#username').val('');
           $("#password").val('');
           openWindow("windows/setup.html");
        }else{
          Materialize.toast('Invalid login.', 4000);
        }
       });
     }

     if(data.restart && parseInt(data.restart)){
       var hour = parseInt(data.restart) - 1;
       var now = moment();
       restart = moment();
       restart.hour(hour).set({'minute':0, 'second':0, 'millisecond':0});
       if(now.isAfter(restart)) restart.add(1,'d'); //if we're past the time today, do it tomorrow
       setInterval(function(){
          var now = moment();
          if(now.isAfter(restart)) {
            chrome.runtime.restart(); //for ChromeOS devices in "kiosk" mode
            chrome.runtime.sendMessage('reload'); //all other systems
          }
        },60*1000);
     }

     if(data.remoteschedule && data.remotescheduleurl){
       schedulepollinterval = data.schedulepollinterval ? data.schedulepollinterval : DEFAULT_SCHEDULE_POLL_INTERVAL;
       scheduleURL = data.remotescheduleurl;
       updateSchedule();
       setInterval(updateSchedule,schedulepollinterval * 60 * 1000);
       setInterval(checkSchedule,CHECK_SCHEDULE_DELAY);
     }

     hidecursor = data.hidecursor ? true : false;
     disablecontextmenu = data.disablecontextmenu ? true : false;
     disabledrag = data.disabledrag ? true : false;
     disabletouchhighlight = data.disabletouchhighlight ? true : false;
     disableselection = data.disableselection ? true : false;
     resetcache = data.resetcache ? true : false;

     reset = data.reset && parseFloat(data.reset) > 0 ? parseFloat(data.reset) : false;

     $('*').on('click mousedown mouseup mousemove touch touchstart touchend keypress keydown',active);

     currentURL = defaultURL = data.url;
     useragent = data.useragent;
     loadContent();

  });

  chrome.runtime.onMessage.addListener(function(data){
    if(data.url && data.url != $("#browser").attr('src')){
      $("#browser").attr('src',data.url);
    }
  });

  function active(){
    if(reset){
      if(activeTimeout) clearTimeout(activeTimeout);
      activeTimeout = setTimeout(function(){
        $("#browser").remove();
        loadContent();
      },reset*60*1000);
    }
  }

  function loadContent(){
    active(); //we should reset the active on load content as well
    var webview = $('<webview id="browser"/>')
     .css({
       width:'100%',
       height:'100%',
       position:'absolute',
       top:0,
       left:0,
       right:0,
       bottom:0
     })
     .attr('partition','persist:kiosk')
     .on('exit',onEnded)
     .on('unresponsive',onEnded)
     .on('loadabort',function(e){if(e.isTopLevel) onEnded(e); })
     .on('consolemessage',function(e){
       if(e.originalEvent.message == 'kiosk:active') active();
     })
     .on('permissionrequest',function(e){
       if(e.originalEvent.permission === 'media') {
         e.preventDefault();
         chrome.permissions.contains({
           permissions: ['audioCapture','videoCapture']
         }, function(result) {
           if (result) {
             // The app has the permissions.
             e.originalEvent.request.allow();
           } else {
             // The app doesn't have the permissions.
             // request it
             $('#mediaPermission .ok').click(function(){
               chrome.permissions.request({
                 permissions: ['audioCapture','videoCapture']
               },function(granted){
                 if(granted) e.originalEvent.request.allow();
               });
             });
             $('#mediaPermission').openModal();
           }
         });
       }else if(e.originalEvent.permission === 'fullscreen') {
          e.originalEvent.request.allow();
       }
     })
     .on('contentload',function(e){
       var browser = e.target;
       if(hidecursor)
         browser.insertCSS({code:"*{cursor:none;}"});
       if(disablecontextmenu)
         browser.executeScript({code:"window.oncontextmenu = function(){return false};"});
       if(disabledrag)
         browser.executeScript({code:"window.ondragstart = function(){return false};"});
       if(disabletouchhighlight)
         browser.insertCSS({code:"*{-webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-touch-callout: none;}"});
       if(disableselection)
         browser.insertCSS({code:"*{-webkit-user-select: none; user-select: none;}"});
       browser.focus();
     })
     .on('loadcommit',function(e){
	      if(useragent) e.target.setUserAgentOverride(useragent);
     })
     .attr('src',currentURL)
     .prependTo('body');
     if(resetcache) {
       chrome.storage.local.remove('resetcache');
       resetcache = false;
       var clearDataType = {
         appcache: true,
         cache: true, //remove entire cache
         cookies: true,
         fileSystems: true,
         indexedDB: true,
         localStorage: true,
         webSQL: true,
       };
       webview[0].clearData({since: 0}, clearDataType, function() {
         $("#browser").remove();
         loadContent();
       });
     }
  }

  function onEnded(event){
    if(!restarting){
      restarting = true;
      $("#browser").remove();
      setTimeout(function(){
        loadContent();
        restarting = false;
      },RESTART_DELAY);
   }
  }

  function openWindow(path){
    chrome.system.display.getInfo(function(d){
      chrome.app.window.create(path, {
        'frame': 'none',
        'id': 'setup',
        'state': 'fullscreen',
        'bounds':{
           'left':0,
           'top':0,
           'width':d[0].bounds.width,
           'height':d[0].bounds.height
        }
      },function(w){
        chrome.app.window.current().close();
        win = w;
        win.fullscreen();
        setTimeout(function(){
          win.fullscreen();
        },1000);
      });
    });
  }

});
