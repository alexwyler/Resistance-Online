var _ = require('underscore');

function User(id) {
  this.id = id;
  this.state = U_STATE.SEARCHING;
  this.getData = function() {
    return {
      id : this.id,
      state : this.state,
      disconnected : this.disconnected
    };
  };

  this.assertInGame = function() {
    if (!this.game) {
      throw new Error('User must be in a game');
    }
  }

  this.assertNotInActiveGame = function() {
    if (this.game && this.game.state != G_STATE.FINISHED) {
      throw new Error('User must not be in an active game');
    }
  }
}

function Mission(turn, attempt, leader) {
  this.turn = turn;
  this.leader = leader;
  this.attempt = attempt;
  this.party = {};
  this.votes = {};
  this.mission_actions = {};

  this.getData = function(secret_vote) {
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

  this.partySize = function() {
    return _.size(this.party);
  };

  this.missionSize = function(game) {
    return MISSION_SIZE[_.size(game.players)][mission.turn - 1];
  }
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

  this.getPublicData = function() {
    return {
      id : this.id,
      players : _.map(
        this.players, function(player) {
          return player.getData();
        }
      ),
      creator : this.creator.id,
      passes : this.passes,
      fails : this.fails,
      missions : _.map(
        this.missions, function(mission) {
          return mission.getData();
        }
      ),
      state : this.state
    };
  };

  this.getDataFor = function(id) {
    var ret = this.getPublicData();
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

  this.addPlayer = function(player) {
    player.game = this;
    this.players[player.id] = player;
  };

  this.removePlayer = function(player) {
    player.game = null;
    delete this.players[player.id];
  };

  this.isFinished = function() {
    return this.state == G_STATE.FINISHED
  }

  this.choosePlayerForMission = function(leader, user) {
    this.assertState(G_STATE.CHOOSING_MISSION);
    this.assertUserIsLeader(leader);
    this.assertUserInGame(user);

    var mission = this.getCurrentMission();
    if (mission.partySize() >= mission.missionSize()) {
      throw new Error('Cannot choose more players for this mission');
    }

    mission.party[data.player.id] = data.player;
  }

  this.unchoosePlayerForMission = function(leader, player) {
    this.assertState(G_STATE.CHOOSING_MISSION);
    this.assertUserIsLeader(leader);
    this.assertUserInGame(player);

    var mission = this.getCurrentMission();
    delete mission.party[data.player.id];
  }

  this.callMissionPartyToVote = function(leader) {
    this.assertState(G_STATE.CHOOSING_MISSION);
    this.assertUserIsLeader(leader);
    var mission = this.getCurrentMission();
    if (mission.partySize() != mission.missionSize()) {
      throw new Error('Mission party must be size ' + mission.missionSize());
    }
    user.game.state = G_STATE.VOTING;
  }

  this.startGame = function(creator) {
    this.assertState(G_STATE.FINDING_PLAYERS);
    this.assertUserIsCreator(creator);
    var num_players = _.size(this.players);
    var num_spies = NUM_SPIES[num_players];
    var player_ids = _.keys(this.players);
    player_ids = _.shuffle(player_ids);
    for (var i = 0; i < num_spies; i++) {
      this.spies.push(player_ids[i]);
    }
    var leader_idx = Math.floor(Math.random() * num_players);
    this.missions.push(new Mission(1, 1, this.players[player_ids[leader_idx]]));
    this.state = G_STATE.CHOOSING_MISSION;
  }

  this.vote = function(player, vote) {
    this.assertState(G_STATE.VOTING);
    this.assertUserInGame(player);
    var votes =  user.game.current_votes;
    votes[user.id] = vote;
    if (_.size(votes) == _.size(user.game.players)) {
      this.resolveVote(user.game);
    }
  }

  this.resolveVote = function() {
    var votes = this.current_votes;
    this.current_votes = {};
    var current_mission = this.getCurrentMission();
    current_mission.votes = votes;
    var pass = 0;
    _.each(
      votes,
      function(vote) {
        pass += vote == VOTE.YES ? 1 : -1;
      }
    );

    if (pass <= 0) {
      if (current_mission.attempt == 5) {
        this.endGame(ROLE.SPY);
      } else {
        this.missions.push(
          new Mission(
            current_mission.turn, current_mission.attempt + 1,
            this.getNextLeader()));
        this.state = G_STATE.CHOOSING_MISSION;
      }
    } else {
      this.state = G_STATE.MISSIONING;
    }
  }

  this.missionAct = function(player, action) {
    this.assertState(G_STATE.MISSIONING);
    this.assertUserOnMission(player);
    current_actions[user.id] = action;
    if (_.size(current_actions) == mission.missionSize()) {
      this.resolveMission(user.game);
    }
  }

  this.resolveMission = function() {
    var actions = this.current_actions;
    this.current_actions = {};
    var current_mission = this.getCurrentMission();
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
      this.passes += 1;
    } else {
      this.fails += 1;
    }

    var game_over = passes >= 3 || fails >= 3;
    if (!game_over) {
      game.missions.push(new Mission(current_mission.turn + 1, 1, game.getNextLeader()));
      game.state = G_STATE.CHOOSING_MISSION;
    } else {
      this.endGame(this.passes == 3 ? ROLE.RESISTANCE : ROLE.SPY);
    }
  }

  this.endGame = function(winning_team) {
    this.state = G_STATE.FINISHED;
    this.winning_team = winning_team;
  }

  // validation

  this.assertUserInGame = function(user) {
    console.log(user);
    console.log(this);
    if (!user || !user.game || !user.game.id == this.id) {
      throw new Error('User must be in game');
    }
  }

  this.assertUserIsLeader = function(leader) {
    this.assertUserInGame(leader);
    var mission = this.getCurrentMission();
    if (mission.leader.id != leader.id) {
      throw new Error('User must be leader');
    }
  }

  this.assertUserOnMission = function(player) {
    this.assertUserInGame(player);
    var mission = this.getCurrentMission();
    if (!_.contains(mission.party, player)) {
      throw new Error('User must be on mission');
    }
  }

  this.assertUserIsCreator = function(creator) {
    this.assertUserInGame(creator);
    if (this.creator.id != creator.id) {
      throw new Error('User must be creator');
    }
  }

  this.assertState = function(state) {
    if (this.state != state) {
      throw new Error('Game must be in state ' + state);
    }
  }
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

exports.User = User;
exports.Game = Game;
