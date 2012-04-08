function createSocket(clientState) {
  var socket = io.connect('http://localhost:8080');

  socket.on('init', function(obj) {
    if (obj.user == null) {
      clientState.trigger('error', { msg: "Login Failed" });
      return;
    }

    if (obj.game) {
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

  socket.on('delete_game', function(game_id) {
    clientState.allGames.remove(game_id);
  });

  socket.on('start_vote', updateGameData);

  socket.on('start_game', updateGameData);
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

  socket.on('update_game', updateGameData);

  /*
   * Updates or creates a game model from raw game data.
   *
   * Returns the game model.
   */
  function updateGameData(gameData) {
    // Ensure the game is in the collection
    var game = clientState.allGames.get(gameData.id);
    if (!game) {
      game = new Game(gameData, { parse: true });
      clientState.allGames.add(game);
    } else {
      game.set(game.parse(gameData));
    }
    game.setClientState(clientState);
    return game;
  }

  function handleJoinGame(gameData) {
    var game = updateGameData(gameData);
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
