$(function(){
  var address = location.hostname+(location.port ? ':'+location.port: '');
  var data;

  $(".button-collapse").sideNav();

  $("#logout").click(function(){
    $('body').hide();
    window.location = 'http://log:out@'+address;
  });

  $.getJSON("http://"+address+'/data',function(d){
    data = d;
    $('#url').val(data.url).siblings('label, i').addClass('active');
    $('#username').val(data.username).siblings('label, i').addClass('active');
    $('body').removeClass('loading');
  });

  $('.tooltip').tooltip();

  $('#restart').click(function(e){
    e.preventDefault();
    $('body').addClass('loading');
    $('#loading h4').text('Restarting...');
    $.ajax({
      url: "http://"+address+'/data',
      type: 'PUT',
      data: {'restart': true},
      success: function(){
        window.location.reload();
      }
    })
  });

  $('#save').click(function(e){
    e.preventDefault();
    var error = [];
    var url = $('#url').val();
    var username = $("#username").val();
    var password = $("#password").val();
    var passwordConfirm = $("#confirm_password").val();
    if(url && (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 )){
      //url is valid
    }else{
      error.push("URL must be valid.");
    }
    if(!username){
      error.push("Username is required");
    }
    if(password && password != passwordConfirm){
      error.push("Passwords must match.");
    }

    if(error.length){
      for(var i = 0; i < error.length; i++){
        toast(error[i], 4000);
      }
      return false;
    }else{
      //ready to reload
      $('body').addClass('loading');
      $('#loading h4').text('Saving...');
      var newData = {};
      if(username != data.username) newData['username'] = username;
      if(password && password != data.password) newData['password'] = password;
      if(url != data.url) newData['url'] = url;
      $.ajax({
        url: "http://"+address+'/data',
        type: 'PUT',
        data: newData,
        success: function(){
          window.location.reload();
        }
      })
    }
  });

})
