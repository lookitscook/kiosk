chrome.runtime.onMessage.addListener(handleMessage);

var status = 'Initializing';

function handleMessage(request, sender, sendResponse) {
  if (request.status) {
    status = request.status;
    $('#message').text(status);
  }
}

$(function() {
  $('#message').text(status);
});