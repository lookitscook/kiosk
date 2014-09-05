$(function(){

  $('#browser').on('newwindow',function(e){
    e.preventDefault();
    window.open(e.originalEvent.targetUrl);
  });

});
