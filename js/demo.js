/*
 * Kiosk v5.14.0
 * Copyright (C) 2017 M. P. Cook Limited Liability Co.  <support@cook.company>
 * All rights reserved.
*/

$(function(){

  $('#browser').on('newwindow',function(e){
    e.preventDefault();
    window.open(e.originalEvent.targetUrl);
  });

});
