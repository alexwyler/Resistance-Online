var path = require('path');
var fs = require('fs');

var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var _ = require('underscore');
var modulr = require('modulr');
var facebook = require('./facebook');
var resistance = require('./resistance');
var lobby = require('./lobby');
var SocketPlayer = require('./SocketPlayer').SocketPlayer;
var Bot = require('./bot/Bot');

var APP_SUCRETS = '420e28e9c2977c1affbe0c084d95ada4';

// listeners

app.listen(8080);
app.use('/public', express.static(__dirname + '/public'));
app.get(
  '/',
  function(req, res) {
    res.sendfile(__dirname + '/public/html/resistance.html');
  });

app.get('/js/pkg/*', function(req, res) {
  var package = req.params[0];
  var is_dev = (req.param('dev') !== void 0);
  var config = {
    environment: is_dev ? 'development' : 'production',
    main: package,
    minify: !is_dev,
    paths: [ 'public/lib', 'public/js' ]
  };
  modulr.build(package, config, function(err, builtSpec) {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.write(err.stack);
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.write(builtSpec.output);
    res.end();
  });
});

// events

io.sockets.on('connection', registerClient);

function registerClient(socket, player) {

  // if player is not passed, the client must emit a 'init' event with auth data
  var user = null;
  if (player) {
    var user = player;
  }

  // handle errors

  var handled = function(func) {
    return function(data) {
      try {
        func(data);
      } catch (e) {
        stack = e.stack
        if (!stack) {
          stack = (new Error('Unkown Error')).stack;
        }
        console.log(stack);
        error(e.message);
      }
    }
  };

  socket.old_on = socket.on;
  socket.on = function(event, func) {
    socket.old_on(
      event,
      handled(func)
    );
  }

  // register events

  socket.on(
    'init',
    function (data) {
      var signed_data = facebook.parse_fbsr(data.auth.signedRequest, APP_SUCRETS);
      if (signed_data && signed_data.user_id) {
        var uid = signed_data.user_id;
        if (process.env.DEBUG && data.override_id) {
          uid = data.override_id;
          socket.log.warn(signed_data.user_id + " is masquerading as " + uid);
        }
        user = lobby.players[uid];
        if (!user) {
          user = new SocketPlayer(uid, socket);
          lobby.players[uid] = user;
        }
        user.socket = socket;
        user.disconnected = false;
      } else {
        throw new Error('Failed to authenticate');
      }

      var ret = {
        user : user.getData()
      };

      if (user.game && !user.game.isFinished()) {
        ret.game = user.game.getKnownData(user.id);
      } else {
        ret.game_list = getClientGameListData();
      }
      socket.emit('init', ret);
    }
  );

  socket.on(
    'choose_player',
    function(player_id) {
      console.log(player_id);
      user.assertInGame();
      user.game.choosePlayerForMission(user, lobby.players[player_id]);
      broadcastToGame(user.game, 'choose_player', player_id);
    }
  );

  socket.on(
    'add_bot',
    function() {
      user.game.assertPlayerIsCreator(user);
      var botClient = Bot.newBotClient();
      user.game.addPlayer(botClient.player);
      broadcastGameData('player_join', user.game, true);
      registerClient(botClient.player.socket, botClient.player);
      botClient.player.socket.emit('join_game', user.game);
    }
  );

  // for debugging purposes, send back the current game
  socket.on(
    'update_game',
    function() {
      user.assertInGame();
      socket.emit('update_game', user.game.getKnownData(user.id));
    }
  );

  socket.on(
    'unchoose_player',
    function(player_id) {
      user.assertInGame();
      user.game.unchoosePlayerForMission(user, lobby.players[player_id]);
      broadcastToGame(user.game, 'unchoose_player', player_id);
    }
  );

  socket.on(
    'start_vote',
    function(data) {
      user.assertInGame();
      user.game.callMissionPartyToVote(user);
      broadcastGameData('start_vote');
    }
  );

  socket.on(
    'disconnect', function () {
      _.each(lobby.players, function(user) {
        if (user.socket && user.socket.id == socket.id) {
          user.socket = null;
          user.disconnected = true;
        }
      });
    });

  socket.on(
    'new_game',
    function() {
      user.assertNotInActiveGame();
      var new_game = new resistance.ResistanceGame(lobby.nextGameID(), user);
      lobby.games[new_game.id] = new_game;
      new_game.addPlayer(user);
      socket.emit('join_game', new_game.getKnownData(user.id));
      broadcastGameList('new_game');
    });

  socket.on(
    'join_game',
    function(game_id) {
      user.assertNotInActiveGame();
      var game = lobby.games[game_id];
      game.addPlayer(user);
      broadcastGameData('player_join', game, true);
      socket.emit('join_game', game.getKnownData(user.id));
    }
  );

  socket.on(
    'start_game',
    function(data) {
      user.game.startGame(user);
      broadcastGameData('start_game', user.game);
    }
  );

  socket.on(
    'leave_game',
    function(data) {
      var game = user.game;
      user.game.removePlayer(user);
      socket.emit('leave_game');
      if (_.size(game.players) > 0) {
        broadcastGameData('player_leave', game);
      } else {
        delete lobby.games[game.id];
        broadcastAll('delete_game', game.id);
      }
    }
  );

  socket.on(
    'vote',
    function(vote) {
      user.game.vote(user, vote);
      if (user.game.getInnerState() != resistance.M_STATE.VOTING) {
        broadcastGameData('vote_complete');
        if (user.game.finished) {
          broadcastGameData('game_complete');
        }
      }
    }
  );

  socket.on(
    'mission_act',
    function(action) {
      user.game.missionAct(user, action);
      if (user.game.getInnerState() != resistance.M_STATE.MISSIONING) {
        broadcastGameData('mission_complete');
        if (user.game.finished) {
          broadcastGameData('game_complete');
        }
      }
    }
  );

  var error = function(msg) {
    socket.emit(
      'error', {
        msg : msg
      });
  };

  var broadcastAll = function(event, data, skip_sender) {
    broadcast(lobby.players, event, data, skip_sender);
  };

  var broadcast = function(users, event, data, skip_sender) {
    for (uid in users) {
      var user = users[uid];
      if (!user.disconnected &&
          (!skip_sender || socket.id != user.socket.id)) {
        user.socket.emit(event, data);
      }
    }
  };

  var broadcastToGame = function(game, event, data, skip_sender) {
    broadcast(game.players, event, data, skip_sender);
  }

  var broadcastGameData = function(event, game, skip_sender) {
    if (!game) {
      game = user.game;
    }
    _.each(
      game.players,
      function(user) {
        if (!user.disconnected &&
            (!skip_sender || socket.id != user.socket.id)) {
          user.socket.emit(event, game.getKnownData(user.id));
        }
      });
  };

  var getClientGameListData = function() {
    return _.map(
      lobby.games,
      function(game) {
        return game.getKnownData();
      });
  };

  var broadcastGameList = function(event) {
    _.each(
      lobby.players,
      function(user) {
        if (!user.disconnected &&
            (!user.game || user.game.finished)) {
          user.socket.emit(
            event,
            getClientGameListData()
          );
        }
      }
    );
  };
}
