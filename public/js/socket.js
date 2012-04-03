function createSocket(clientState) {
  var socket = io.connect('http://localhost:8080');

  socket.on('init', function(obj) {
    if (obj.user == null) {
      clientState.trigger('error', { msg: "Login Failed" });
    } else if (obj.game) {
      handleJoinGame(obj.game);
    } else {
      clientState.allGames.add(obj.game_list, { parse: true });
    }
  });

  socket.on('error', function(obj) {
    clientState.trigger('error', obj);
  });

  socket.on('new_game', function(games) {
    clientState.allGames.add(games, { parse: true });
  });

  socket.on('delete_game', function(event) {
    clientState.allGames.remove(event.game.id);
  });

  socket.on('start_game', handleJoinGame);
  socket.on('join_game', handleJoinGame);

  socket.on('choose_player', function(player_id) {
    var game = clientState.game;
    var party = game.missions.last().party;
    party.add(
      game.players.get(player_id)
    );
  });

  socket.on('unchoose_player', function(player_id) {
    var game = clientState.game;
    game.missions.last().party.remove(player_id);
  });

  function handleJoinGame(data) {
    // Ensure the game is in the collection
    var game = clientState.allGames.get(data.id);
    if (!game) {
      game = new Game(data, { parse: true });
      clientState.allGames.add(game);
    } else {
      game.set(game.parse(data));
    }
    clientState.didJoinGame(game);
  }

  socket.on('leave_game', function() {
    clientState.didLeaveGame();
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
