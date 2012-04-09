var _ = require('underscore')._;
var ClientState = require('models/ClientState').ClientState;
var ClientView = require('views/ClientView').ClientView;
var Game = require('models/Game').Game;

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

  var socket = io.connect('http://localhost:8080');
  var clientState = new ClientState({
    socket: socket
  });
  var clientView = new ClientView({
    model: clientState,
    el: $('#root')
  });
  clientView.render();

  window._debugView = clientView;
  window._debugModel = clientState;

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
  socket.on('vote_complete', updateGameData);

  socket.on('start_game', updateGameData);
  socket.on('join_game', handleJoinGame);

  socket.on('choose_player', function(player_id) {
    clientState.game.missions.last().party.add(
      clientState.game.players.get(player_id));
  });

  socket.on('mission_complete', updateGameData);

  socket.on('unchoose_player', function(player_id) {
    clientState.game.missions.last().party.remove(player_id);
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
    clientState.didJoinGame(updateGameData(gameData));
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

  socket.on('game_complete', updateGameData);
});

window.test = function(){
  var socket = window._debugModel.socket;
  socket.emit('leave_game');
  socket.emit('new_game');
  socket.emit('add_bot');
  socket.emit('start_game');
}
