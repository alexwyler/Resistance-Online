var ClientView = require('./views/ClientView').ClientView;

$(document).ready(function() {
  window.fbAsyncInit = function() {
    FB.init({
      appId: '326683484060385',
      status: true,
      xfbml: true
    });
    FB.Event.subscribe('auth.statusChange',
      _(clientState.login).bind(clientState));
  };

  var clientState = new ClientState();
  socket = createSocket(clientState);
  var clientView = new ClientView({
    model: clientState,
    el: $('#root')
  });
  clientView.render();
});


function test() {
  socket.emit('leave_game');
  socket.emit('new_game');
  socket.emit('start_game');
  socket.emit('choose_player', 1599450468);
  socket.emit('start_vote');
  socket.emit('vote', 'yes');
}