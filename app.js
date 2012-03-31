var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var fs = require('fs');

app.listen(8080);

app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/public/html/main.html');
});

var NEXT_GAME_ID = 1;
function nextGameID() {
  return NEXT_GAME_ID++;
}

function getUser(authData, socket) {
  var user = users[authData.id];

  if (user) {
    // TODO authenticate
  } else {
    user = new User(authData.id);
    users[user.id] = user;
  }
  user.socket = socket;
  user.disconnected = false;

  return user;
}

function json_pull(object, method) {
  var ret = {};
  for (var idx in object) {
    ret[idx] = object[idx][method]();
  }
  return ret;
}

function json_size(object) {
  var count = 0;
  for (idx in object) {
    count++;
  }
  return count;
}

function User(id) {
  this.id = id;
  this.state = U_STATE.SEARCHING;
  this.name = 'User_' + this.id;
  this.socket = null;
  this.disconnected = false;
  this.getClientData = function() {
    return {
      id : this.id,
      name : this.name,
      state : this.state,
      disconnected : this.disconnected
    };
  };
}

function Game(game_id, name) {
  this.players = {};
  this.state = G_STATE.FINDING_PLAYERS;
  this.name = name;
  this.id = game_id;

  this.getPublicClientData = function() {
    return {
      id : this.id,
      name : this.name,
      players : json_pull(this.players, 'getClientData'),
      state : this.state
    };
  };

  this.getClientDataFor = function(id) {
    var ret = this.getPublicClientData();
    // todo
    return ret;
  };

  this.add = function(player) {
    this.players[player.id] = player;
  };

  this.remove = function(player) {
    delete this.players[player.id];
  };
}

// global state

var games = {};
var users = {};

// user state

var U_STATE = {
  SEARCHING : 'searching',
  NOT_READY : 'not_ready',
  READY : 'ready',
  PLAYING : 'playing',
}

// game state

var G_STATE = {
  FINDING_PLAYERS : 'finding_players',
  NOT_READY : 'not_ready',
  CHOOSING_MISSION : 'choosing_mission',
  VOTING : 'voting',
  MISSIONING : 'missioning',
  FINISHED : 'finished'
}

// register events

io.sockets.on('connection', function (socket) {
  socket.on('init', function (data) {
    var user = getUser(data.auth, socket);

    ret = {
      user : user.getClientData(),
      users : json_pull(users, 'getClientData'),
      games : json_pull(games, 'getPublicClientData')
    };

    if (user.game) {
      ret.gameData = user.game.getClientDataFor(user.id);
    }
    socket.emit('init', ret);
  });

  socket.on('disconnect', function () {
    for (var uid in users) {
      var user = users[uid];
      if (user.socket && user.socket.id == socket.id) {
        user.socket = null;
        user.disconnected = true;
      }
    }
  });

  socket.on('new_game', function(data) {
    var user = getUser(data.auth, socket);
    if (user.game && user.game.state != G_STATE.FINISHED) {
      socket.emit('error', {
        msg : "Must finish or quit game before making a new one"
      });
      return;
    }

    var new_game = new Game(nextGameID(), data.name);
    games[new_game.id] = new_game;
    broadcastAll(
      'new_game', {
        game : new_game.getPublicClientData()
      }
    );
    joinGame(user, new_game);
  });

  socket.on('join_game', function(data) {
    var user = getUser(data.auth, socket);
    if (user.game && user.game.state != G_STATE.FINISHED) {
      socket.emit('error', {
        msg : "Must finish or quit game before joining a new one"
      });
    } else if (!games[data.game_id] ||
               games[data.game_id].state != G_STATE.FINDING_PLAYERS) {
      socket.emit('error', {
        msg : "Game is no longer available"
      });
    } else {
      var game = games[data.game_id];
      joinGame(user, game);
    }
  });

  socket.on('leave_game', function(data) {
    var user = getUser(data.auth, socket);
    leaveGame(user);
  });

  var leaveGame = function(user) {
    if (user.game) {
      var game = user.game;
      game.remove(user);
      user.game = null;
      socket.emit('leave_game');
      if (json_size(game.players) > 0) {
        broadcast(game.players, 'player_leave', {
          user : user.getClientData(),
          gameData : game.getPublicClientData()
        }, true);
      } else {
        delete games[game.id];
        broadcastAll('delete_game', {
          game : game.getPublicClientData()
        });
      }
    }
  };

  var joinGame = function(user, game) {
    user.game = game;
    game.add(user);
    broadcast(game.players, 'player_join', {
      user : user.getClientData(),
      game : game.getPublicClientData()
    }, true);
    socket.emit('join_complete', game.getPublicClientData());
  };

  var broadcastAll = function(event, data, skip_sender) {
    broadcast(users, event, data, skip_sender);
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

});

Array.prototype.remove =
  function(v) {
    this.splice(
      this.indexOf(v) == -1
        ? this.length : this.indexOf(v), 1);
  };