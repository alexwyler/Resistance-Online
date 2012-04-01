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
  this.socket = null;
  this.disconnected = false;
  this.getClientData = function() {
    return {
      id : this.id,
      state : this.state,
      disconnected : this.disconnected
    };
  };
}

function Mission(turn, attempt, leader) {
  this.turn = turn;
  this.leader = leader;
  this.attempt = attempt;
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
  this.id = game_id;
  this.missions = [];
  this.creator = creator_id;
  this.spies = [];
  this.current_votes = {};
  this.current_mission_actions = {};
  this.passes = 0;
  this.fails = 0;

  this.getNextLeader = function() {
    var cur_leader = this.getCurrentMission().leader;
    var player_ids = _.keys(this.players);
    var idx = _.indexOf(player_ids, cur_leader.id);
    return this.players[((idx+1) % _.size(player_ids))];
  };

  this.getCurrentMission = function() {
    return _.last(this.missions);
  };

  this.getPublicClientData = function() {
    return {
      id : this.id,
      players : _.map(
        this.players, function(player) {
          return player.getClientData();
        }
      ),
      creator : this.creator.id,
      passes : this.passes,
      fails : this.fails,
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

var VOTE = {
  YES : 'yes',
  NO : 'no'
}

var ACTION = {
  PASS : 'pass',
  FAIL : 'fail'
}

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
            users[uid] = user;
          }
          user.socket = socket;
          user.disconnected = false;
        } else {
          error("Failed to authenticate user");
          return;
        }

        var ret = {
          user : user.getClientData()
        };

        if (user.game && user.game.state != G_STATE.FINISHED) {
          ret.game = user.game.getClientDataFor(user.id);
        } else {
          ret.game_list = getClientGameListData();
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
        broadcastGameList('new_game');
        joinGame(new_game);
      });

    socket.on(
      'join_game',
      function(game_id) {
        if (user.game && user.game.state != G_STATE.FINISHED) {
          error("Must finish or quit game before joining a new one");
        } else if (!games[game_id] ||
                   games[game_id].state != G_STATE.FINDING_PLAYERS) {
          error("Game is no longer available");
        } else {
          var game = games[game_id];
          joinGame(game);
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
        var player_ids = _.keys(game.players);
        player_ids = _.shuffle(player_ids);
        for (var i = 0; i < num_spies; i++) {
          game.spies.push(player_ids[i]);
        }
        var leader_idx = Math.floor(Math.random() * num_players);
        game.missions.push(new Mission(1, 1, users[player_ids[leader_idx]]));
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

    socket.on(
      'vote',
      function(vote) {
        if (!user.game || user.game.state != G_STATE.VOTING) {
          error("You can only vote in a game after the party has been selected");
          return;
        }
        var votes =  user.game.current_votes;
        votes[user.id] = vote;
        if (_.size(votes) == _.size(user.game.players)) {
          resolveVote(user.game);
          broadcastGameData('vote_finished');
        }
      }
    );

    socket.on(
      'mission_act',
      function(action) {
        if (!user.game || user.game.state != G_STATE.MISSIONING) {
          error("You can only mission in a game after the party has been selected");
          return;
        }
        var mission = user.game.getCurrentMission();
        var current_actions = user.game.current_mission_actions;
        if (!mission.party[user.id]) {
          error("You can only mission if you have been chosen on the party");
          return;
        }
        current_actions[user.id] = action;
        if (_.size(current_actions)
            == MISSION_SIZE[_.size(user.game.players)][mission.turn]) {
          resolveMission(user.game);
        }
      }
    );

    var resolveVote = function(game) {
      var votes = game.current_votes;
      game.current_votes = {};
      var current_mission = game.getCurrentMission();
      current_mission.votes = votes;
      var pass = 0;
      _.each(
        votes,
        function(vote) {
          pass += vote == VOTE.YES ? 1 : -1;
        }
      );

      if (pass <= 0) {
        game.missions.push(
          new Mission(
            current_mission.turn, current_mission.attempt + 1,
            game.getNextLeader()));
        game.state = G_STATE.CHOOSING_MISSION;
      } else {
        game.state = G_STATE.MISSIONING;
      }
      broadcastGameData('vote_complete');

      if (current_mission.attempt == 5 && game.state == G_STATE.CHOOSING_MISSION) {
        broadcastGameData('game_complete');
      }
    };

    var resolveMission = function(game) {
      var actions = game.current_actions;
      game.current_actions = {};
      var current_mission = game.getCurrentMission();
      current_mission.mission_actions = actions;
      var fails = 0;
      _.each(
        actions,
        function(action) {
          fails += ACTION.FAIL;
        }
      );

      var pass = fails < ((current_mission.turn == 4
                           && _.size(game.players) > 6) ? 2 : 1);

      if (pass) {
        game.passes += 1;
      } else {
        game.fails += 1;
      }

      var game_over = passes >= 3 || fails >= 3;
      if (!game_over) {
        game.missions.push(new Mission(current_mission.turn + 1, 1, game.getNextLeader()));
        game.state = G_STATE.CHOOSING_MISSION;
      } else {
        game.sate = G_STATE.FINISHED;
      }

      broadcastGameData('mission_complete');

      if (game_over) {
        broadcastGameData('game_complete');
      }
    };

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
        game.players,
        function(user) {
          if (!user.disconnected &&
              (!skip_sender || socket.id != user.socket.id)) {
            user.socket.emit(event, game.getClientDataFor(user.id));
        }
      });
    };

    var getClientGameListData = function() {
      return _.map(
        games,
        function(game) {
          return game.getPublicClientData();
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
              getClientGameListData()
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