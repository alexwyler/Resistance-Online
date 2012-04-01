var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var fs = require('fs');
var _ = require('underscore');
var facebook = require('./facebook');
var APP_SUCRETS = '420e28e9c2977c1affbe0c084d95ada4';

app.listen(8080);
app.use('/public', express.static(__dirname + '/public'));
app.get(
  '/',
  function(req, res) {
    res.sendfile(__dirname + '/public/html/resistance.html');
  });

// model

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

function Mission(turn, leader) {
  this.turn = turn;
  this.leader = leader;
  this.party = {};
  this.votes = {};
  this.mission_actions = {};
  this.getClientData = function(secret_vote) {
    return {
      turn : this.turn,
      leader : this.leader.id,
      party : _.keys(this.party),
      votes : _.map(
        this.votes,
        function(vote, uid) {
          var ret = {
            vote : vote
          };
          if (!secret_vote) {
            ret.uid = uid;
          }
          return ret;
        })
    };
  };
}

function Game(game_id, creator_id) {
  this.players = {};
  this.state = G_STATE.FINDING_PLAYERS;
  this.name = name;
  this.id = game_id;
  this.missions = [];
  this.creator =
  this.spies = [];

  this.getPublicClientData = function() {
    return {
      id : this.id,
      name : this.name,
      players : _.map(
        this.players, function(player) {
          return player.getClientData();
        }
      ),
      missions : _.map(
        this.missions, function(mission) {
          return mission.getClientData();
        }
      ),
      state : this.state
    };
  };

  this.getClientDataFor = function(id) {
    var ret = this.getPublicClientData();
    var is_spy = _.contains(this.spies, id);
    var roles = {};
    _.each(
      this.players,
      function(player, uid) {
        if (is_spy) {
          roles[uid] =
            _.contains(this.spies, uid) ?
            ROLE.SPY :
            ROLE.RESISTANCE;
        }
      }.bind(this));
    ret.roles = roles;
    return ret;
  };

  this.add = function(player) {
    this.players[player.id] = player;
  };

  this.remove = function(player) {
    delete this.players[player.id];
  };
}

var MISSION_SIZE = {
  1 : [1, 1, 1, 1, 1],
  2 : [2, 2, 2, 2, 2],
  5 : [2, 3, 2, 3, 3],
  6 : [2, 3, 4, 3, 4],
  7 : [2, 3, 3, 4, 4],
  8 : [3, 4, 4, 5, 5],
  9 : [3, 4, 4, 5, 5],
  10 : [3, 4, 4, 5, 5]
};

var NUM_SPIES = {
  1 : 1,
  5 : 2,
  6 : 2,
  7 : 3,
  8 : 3,
  9 : 4,
  10 : 4
};

var G_STATE = {
  FINDING_PLAYERS : 'finding_players',
  NOT_READY : 'not_ready',
  CHOOSING_MISSION : 'choosing_mission',
  VOTING : 'voting',
  MISSIONING : 'missioning',
  FINISHED : 'finished'
};

var ROLE = {
  SPY : 'spy',
  RESISTANCE : 'resistance'
};

var U_STATE = {
  SEARCHING : 'searching',
  NOT_READY : 'not_ready',
  READY : 'ready',
  PLAYING : 'playing'
};

// global state

var games = {};
var users = {};

var NEXT_GAME_ID = 1;
function nextGameID() {
  return NEXT_GAME_ID++;
}

// events

io.sockets.on(
  'connection',
  function (socket) {
    var user = null;

    socket.on(
      'init',
      function (data) {
        var signed_data = facebook.parse_fbsr(data.auth.signedRequest, APP_SUCRETS);
        if (signed_data && signed_data.user_id) {
          var uid = signed_data.user_id;
          user = users[uid];
          if (!user) {
            user = new User(uid);
          }
          user.socket = socket;
          user.disconnected = false;
        } else {
          error("Failed to authenticate user");
        }

        var ret = {
          user : user.getClientData()
        };

        if (user.game && user.game.state != G_STATE.FINISHED) {
          ret.game = user.game.getClientDataFor(user.id);
        } else {
          ret.game_list = _.map(
            games,
            function(game) {
              return game.getPublicClientData();
            });
        }
        socket.emit('init', ret);
      }
    );

    socket.on(
      'choose_player',
      function(data) {
        if (!user.game
            || user.game.state != G_STATE.CHOOSING_MISSION) {
          error('You must be in a game choosing mission players to choose players');
          return;
        }
        var mission = _.last(user.game.missions);
        if (mission.leader.id != user.id) {
          error('You must be leader to choose players');
          return;
        }

        if (_.size(mission.party) >=
            MISSION_SIZE[_.size(user.game.players)][mission.turn]) {
          error('You have added the max number of players for this mission');
          return;
        }

        mission.party[data.player.id] = data.player;
        broadcastGameData('choose_player', true);
      }
    );

    socket.on(
      'unchoose_player',
      function(data) {
        if (!user.game
            || user.game.state != G_STATE.CHOOSING_MISSION) {
          error('You must be in a game choosing mission players to choose players');
          return;
        }
        var mission = _.last(user.game.missions);
        if (mission.leader.id != user.id) {
          error('You must be leader to choose players');
          return;
        }

        mission.party = _.reject(
          mission.party,
          function(member) {
            return member == member.id;
          }
        );
        broadcastGameData('unchoose_player', true);
      }
    );

    socket.on(
      'start_vote',
      function(data) {
        if (!user.game
            || user.game.state != G_STATE.CHOOSING_MISSION) {
          error('You must be in a game choosing mission players to choose players');
          return;
        }
        var mission = _.last(user.game.missions);
        if (mission.leader.id != user.id) {
          error('You must be leader to start vote');
          return;
        }

        user.game.state = G_STATE.VOTING;
        broadcastGameData('start_vote');
      }
    );

    socket.on(
      'disconnect', function () {
        for (var uid in users) {
          var user = users[uid];
          if (user.socket && user.socket.id == socket.id) {
            user.socket = null;
            user.disconnected = true;
          }
        }
      });

    socket.on(
      'new_game',
      function() {
        if (user.game && user.game.state != G_STATE.FINISHED) {
          error("Must finish or quit game before making a new one");
          return;
        }
        var new_game = new Game(nextGameID(), user);
        games[new_game.id] = new_game;
        broadcastAll(
          'new_game', {
            game : new_game.getPublicClientData()
          }
        );
        joinGame(user, new_game);
      });

    socket.on(
      'join_game',
      function(data) {
        if (user.game && user.game.state != G_STATE.FINISHED) {
          error("Must finish or quit game before joining a new one");
        } else if (!games[data.game_id] ||
                   games[data.game_id].state != G_STATE.FINDING_PLAYERS) {
          error("Game is no longer available");
        } else {
          var game = games[data.game_id];
          joinGame(user, game);
        }
      });

    socket.on(
      'start_game',
      function(data) {
        if (user.game && user.game.state != G_STATE.FINDING_PLAYERS) {
          error('Must be in a game that has yet to start');
          return;
        }
        var game = user.game;
        var num_players = json_size(game.players);
        var num_spies = NUM_SPIES[num_players];
        var player_ids = _.keys(users);
        player_ids = _.shuffle(player_ids);
        for (var i = 0; i < num_spies; i++) {
          game.spies.push(player_ids[i]);
        }
        var leader_idx = Math.floor(Math.random() * num_players);
        game.missions.push(new Mission(1, users[player_ids[leader_idx]]));
        game.state = G_STATE.CHOOSING_MISSION;
        _.each(
          game.players,
          function(user) {
            user.socket.emit('start_game', game.getClientDataFor(user.id));
          }
        );
      }
    );

    socket.on(
      'leave_game',
      function(data) {
        if (user.game) {
          var game = user.game;
          game.remove(user);
          user.game = null;
          socket.emit('leave_game');
          if (_.size(game.players) > 0) {
            broadcastGameData(
              'player_leave',
              game
            );
          } else {
            delete games[game.id];
            broadcastAll(
              'delete_game', {
                game : game.getPublicClientData()
              });
          }
        }
      }
    );

    var joinGame = function(game) {
      user.game = game;
      game.add(user);
      broadcastGameData('player_join', game, true);
      socket.emit('join_game', game.getClientDataFor(user.id));
    };

    var error = function(msg) {
      socket.emit(
        'error', {
          msg : msg
        });
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

    var broadcastGameData = function(event, game, skip_sender) {
      _.each(
        game.users,
        function(user) {
          if (!user.disconnected &&
              (!skip_sender || socket.id != user.socket.id)) {
            user.socket.emit(event, game.getClientDataFor(user.id));
        }
      });
    };

    var broadcastGameList = function(event) {
      _.each(
        users,
        function(user) {
          if (!user.disconnected &&
              (!user.game || user.game.state == G_STATE.FINISHED)) {
            user.socket.emit(
              event,
              _.map(
                games,
                function(game) {
                  return game.getPublicClientData();
                })
            );
          }
        }
      );
    };
  });

// Utils

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

Array.prototype.remove =
  function(v) {
    this.splice(
      this.indexOf(v) == -1
        ? this.length : this.indexOf(v), 1);
  };