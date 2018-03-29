/*
 * Kiosk v5.14.0
 * Copyright (C) 2017 M. P. Cook Limited Liability Co.  <support@cook.company>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
const DEFAULT_PICNIC_DOMAINS = ['picnic.nl', 'picnicinternational.com'];

function addHeader(header){
  $('#headers').append(`<li class="header-element">
  <input id="header-name" value="${header.name}" class="input-field col s5" type="text" placeholder="Header name"/>
  <input id="header-value" value="${header.value}" class="input-field col offset-s1 s5" type="text" placeholder="Value"/>
  <br/></li>`);
}

function addPicnicDomain(domain){
  $('#picnic-domains').append(`<li>
  <input value="${domain}" class="picnic-domain input-field col s12" type="text" placeholder="Picnic Domain"/>
  <br/></li>`);
}

function getHeaders(){
  let headers = []
  $(".header-element" ).each( function( index, element ){
    let headerName = $( this ).find("#header-name").val();
    let headerValue = $( this ).find("#header-value").val();
    if (headerName && headerValue){
      headers.push({name: headerName, value: headerValue});
    }
  });
  return headers;
}

function getPicnicDomains(){
  let domains = []
  $(".picnic-domain" ).each( function( index, element ){
    console.log(element.value)
    let domain = element.value;
    if (domain) {
      domains.push(domain);
    }
  });
  return domains;
}

$(function(){
  var address = location.hostname+(location.port ? ':'+location.port: '');
  var data;

  $(".button-collapse").sideNav();

  $("#logout").click(function(){
    $('body').hide();
    window.location = 'http://log:out@'+address;
  });

  $("#remote-schedule").on('change',function(){
    if($("#remote-schedule").is(':checked')){
      $('.remote-schedule-detail').hide().removeClass('disabled').slideDown();
    }else{
      $('.remote-schedule-detail').slideUp();
    }
  });

  $.getJSON("http://"+address+'/data',function(d){
    data = d;
    $('#url').val(data.url).siblings('label, i').addClass('active');
    $('body').removeClass('loading');
    if(data.headers){
      data.headers.forEach(function(header){
        addHeader(header);
      });  
    }

    if(!data.picnicDomains){
      data.picnicDomains = DEFAULT_PICNIC_DOMAINS;
    }

    data.picnicDomains.forEach(function(domain){
      addPicnicDomain(domain);
    });  
    
    if(data.remoteschedule){
      $("#remote-schedule").prop("checked",true);
      $('.remote-schedule-detail').removeClass('disabled');
    }
    if(data.remotescheduleurl)
      $("#remote-schedule-url").val(data.remotescheduleurl).siblings('label').addClass('active');
  
    if(data.schedulepollinterval){
     $('#schedule-poll-interval').val(data.schedulepollinterval);
    }
  });

  $('.tooltip').tooltip();

  $('#restart').click(function(e){
    e.preventDefault();
    $('body').addClass('loading');
    $('#loading h4').text('Restarting...');
    $.ajax({
      url: "http://"+address+'/data',
      type: 'PUT',
      data: JSON.stringify({'restart': true}),
      success: reload
    })
  });

  $('#add_header').on('click', function(header) {
    addHeader({name: '', value: ''});
  });

  $('#add_picnic_domain').on('click', function(header) {
    addPicnicDomain('');
  });

  $('#save').click(function(e){
    e.preventDefault();
    var error = [];
    var url = $('#url').val();
    var remoteschedule = $("#remote-schedule").is(':checked');
    var remotescheduleurl = $("#remote-schedule-url").val();
    var schedulepollinterval = parseFloat($('#schedule-poll-interval').val()) ? parseFloat($('#schedule-poll-interval').val()) : DEFAULT_SCHEDULE_POLL_INTERVAL;
  
    if(url && (url.indexOf("http://") >= 0 || url.indexOf("https://") >= 0 )){
      //url is valid
    }else{
      error.push("URL must be valid.");
    }

    if(error.length){
      for(var i = 0; i < error.length; i++){
        Materialize.toast(error[i], 4000);
      }
      return false;
    }else{
      //ready to reload
      $('body').addClass('loading');
      $('#loading h4').text('Saving...');
      var newData = {};
      if (remoteschedule){
        newData['remoteschedule'] = true;
        newData['remotescheduleurl'] = remotescheduleurl;
        newData['schedulepollinterval'] = schedulepollinterval;
      }
      if(url != data.url) newData['url'] = url;
      newData['headers'] = getHeaders();
      newData['picnicDomains'] = getPicnicDomains();

      console.log(JSON.stringify(newData));
      $.ajax({
        url: "http://"+address+'/data',
        type: 'PUT',
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        data: JSON.stringify(newData),
        success: reload
      })
    }
  });

  function reload(){
    $('#loading').text('Restarting...');
    $('#loading').append('<h5>5</h5>');
    var timerInterval = setInterval(function(){
      var currentTime = parseInt($('#loading > h5').text(),10);
      if(currentTime > 1){
        $('#loading > h5').text(currentTime - 1);
      }
    }, 1000);
    setTimeout(function(){
      clearInterval(timerInterval);
      window.location.reload();
    }, 5 * 1000 + 500);
  }

})
