function createSocket(clientState) {
  var socket = io.connect('http://localhost:8080');

  socket.on('init', function(obj) {
    if (obj.user == null) {
      clientState.trigger('error', { msg: "Init Failed" });
    } else if (obj.game) {
      clientState.setGame(obj.game);
    } else {
      clientState.allGames.reset(obj.game_list);
    }
  });

  socket.on('error', function(obj) {
    clientState.trigger('error', obj);
  });

  socket.on('new_game', function(games) {
    clientState.allGames.reset(games);
  });

  socket.on('delete_game', function(games) {
    clientState.allGames.reset(games);
  });

  socket.on('start_game', function(game) {
    clientState.setGame(game);
  });

  socket.on('join_game', function(game) {
    clientState.setGame(game);
  });

  socket.on('player_join', function(game) {
    clientState.game.players.reset(game.players);
  });

  socket.on('player_leave', function(game) {
    clientState.game.players.reset(game.players);
  });

  clientState.on('login', function() {
    socket.emit('init', {
      auth: clientState.attributes
    });
  });

  return socket;
}
