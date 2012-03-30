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
  sockets[user.id] = socket;
  user.disconnected = false;

  return user;
}

function User(id) {
  this.id = id;
  this.state = U_STATE.SEARCHING;
  this.name = 'User_' + this.id;
  this.disconnected = false;
}

function Game(game_id, name) {
  this.players = [];
  this.state = G_STATE.FINDING_PLAYERS;
  this.name = name;
  this.id = game_id;

  this.getPublicData = function() {
    // todo;
    return this;
  };

  this.getDataFor = function(id) {
    // todo;
    return this;
  };

  this.add = function(id) {
    this.players.push(id);
  }

  this.remove = function(id) {
    this.players.remove(id);
  }
}

function broadcastAll(event, data) {
  uids = [];
  for (id in users) {
    uids.push(id);
  }
  broadcast(uids, event, data);
}

function broadcast(user_ids, event, data) {
  user_ids.forEach(
    function(id) {
      if (sockets[id]) {
        sockets[id].emit(event, data);
      }
    });
}

// global state

var games = {};
var users = {};
var sockets = {};

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
    // todo only share public data
    ret = {
      games : games,
      user : user,
      users : users
    };
    if (user.game_id) {
      ret.gameData = games[user.game_id].getDataFor(user.id);
    }
    socket.emit('init', ret);
  });

  socket.on('disconnect', function () {
    for (var uid in sockets) {
      if (sockets[uid].id == socket.id) {
        delete sockets[uid];
        user = users[uid];
        if (user) {
          user.disconnected = true;
        }
      }
    }
  });

  socket.on('new_game', function(data) {
    var user = getUser(data.auth, socket);
    console.log(user);
    if (user.game_id) {
      var cur_game = games[user.game_id];
      if (cur_game && cur_game.state != G_STATE.FINISHED) {
        socket.emit('error', {
          msg : "Must finish or quit game before making a new one"
        });
        return;
      }
    }
    var new_game = new Game(nextGameID(), data.name);
    games[new_game.id] = new_game;
    broadcastAll(
      'new_game', {
        game : new_game
      }
    );
    joinGame(user.id, new_game.id);
  });

  socket.on('join_game', function(data) {
    var user = getUser(data.auth, socket);
    if (user.game_id) {
      var cur_game = games[user.game_id];
      if (cur_game.state != G_STATE.FINISHED) {
        socket.emit('error', {
          msg : "Must finish or quit game before joining a new one"
        });
      }
    } else if (!games[data.game_id] ||
               games[data.game_id].state != G_STATE.FINDING_PLAYERS) {
      socket.emit('error', {
        msg : "Game is no longer available"
      });
    } else {
      joinGame(user.id, data.game_id);
    }
  });

  socket.on('leave_game', function(data) {
    var user = getUser(data.auth, socket);
    leaveGame(user.id);
  });

  var leaveGame = function(uid) {
    var user = users[uid];
    if (user.game_id) {
      var cur_game = games[user.game_id];
      if (cur_game) {
        cur_game.players.remove(user.id);
      }
      user.game_id = null;
      socket.emit('leave_game');
      if (cur_game.players.length > 0) {
        broadcast(cur_game.players, 'update_lobby', cur_game.getPublicData());
      } else {
        delete games[cur_game.id];
        broadcastAll('delete_game', {
          game_id : cur_game.id
        });
      }
    }
  };

  var joinGame = function(user_id, game_id) {
    var user = users[user_id];
    var game = games[game_id];
    user.game_id = game_id;
    game.add(user.id);
    broadcast(game.players, 'update_lobby', game.getPublicData());
  };
});

Array.prototype.remove =
  function(v) {
    this.splice(
      this.indexOf(v) == -1
        ? this.length : this.indexOf(v), 1);
  };