var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var fs = require('fs');
var _ = require('underscore');
var facebook = require('./facebook');
var resistance = require('./resistance');
var lobby = require('./lobby');

var APP_SUCRETS = '420e28e9c2977c1affbe0c084d95ada4';

// listeners

app.listen(8080);
app.use('/public', express.static(__dirname + '/public'));
app.get(
  '/',
  function(req, res) {
    res.sendfile(__dirname + '/public/html/resistance.html');
  });

// events

io.sockets.on(
  'connection',

  function (socket) {
    var user = null;

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
          console.log(e);
          console.log(stack)
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
          user = lobby.users[uid];
          if (!user) {
            user = new SocketPlayer(uid, socket);
            lobby.users[uid] = user;
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
        user.assertInGame();
        user.game.choosePlayerForMission(user, lobby.users[player_id]);
        broadcastGameData('choose_player', true);
      }
    );

    socket.on(
      'unchoose_player',
      function(data) {
        user.assertInGame();
        user.game.unchoosePlayerForMission(user, lobby.users[player_id]);
        broadcastGameData('unchoose_player', true);
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
        _.each(lobby.users, function(user) {
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
        broadcastGameList('new_game');
        new_game.addPlayer(user);
        socket.emit('join_game', new_game.getKnownData(user.id));
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
          broadcastAll(
            'delete_game', {
              game : game.getPublicData()
            });
        }
      }
    );

    socket.on(
      'vote',
      function(vote) {
        user.game.vote(user, vote);
        if (user.game.state != G_STATE.VOTING) {
          broadcastGameData('vote_complete');
          if (game.state == G_STATE.FINISHED) {
            broadcastGameData('game_complete');
          }
        }
      }
    );

    socket.on(
      'mission_act',
      function(action) {
        user.game.missionAct(user, action);
        if (user.game.state != G_STATE.MISSIONING) {
          broadcastGameData('mission_complete');
          if (game.state == G_STATE.FINISHED) {
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
      broadcast(lobby.users, event, data, skip_sender);
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

    var broadcastGameData = function(event, game, skip_sender) {
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
        lobby.users,
        function(user) {
          if (!user.disconnected &&
              (!user.game || user.game.state == G_STATE.FINISHED)) {
            user.socket.emit(
              event,
              getClientGameListData()
            );
          }
        }
      );
    };
  }
);

function SocketPlayer(id, socket) {
  lobby.Player.call(this, id);
  this.socket = socket;
}

SocketPlayer.prototype = new lobby.Player();
SocketPlayer.prototype.constructor = SocketPlayer;

SocketPlayer.prototype.getData = function() {
  return {
    id : this.id,
    state : this.state,
    disconnected : this.disconnected,
  };
};