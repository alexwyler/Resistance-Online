var _ = require('underscore');
var lobby = require('./lobby');

function Mission(turn, attempt, leader) {

  if (!leader || !turn || !attempt) {
    throw new Error("Must instantiate mission with turn, attempt and leader");
  }

  this.turn = turn;
  this.leader = leader;
  this.attempt = attempt;
  this.party = {};
  this.votes = {};
  this.actions = {};
  this.state = M_STATE.CHOOSING_MISSION;
  this.id = turn * 100 + attempt;

  this.getData = function(secret_vote) {
    return {
      id : this.id,
      turn : this.turn,
      attempt : this.attempt,
      leader_id : this.leader.id,
      party : _.map(
        this.party,
        function(user) {
          return user.getData()
        }
      ),
      actions : _.map(
        this.actions,
        function(action, uid) {
          return {user_id : uid, mission_action: action};
        }
      ),
      state : this.state,
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
    return MISSION_SIZE[_.size(game.players)][this.turn - 1];
  }
}

function ResistanceGame(game_id, creator) {
  lobby.Game.call(this, game_id, creator);
  this.state = lobby.G_STATE.FINDING_PLAYERS;
  this.missions = [];
  this.spies = [];
  this.current_votes = {};
  this.current_mission_actions = {};
  this.passes = 0;
  this.fails = 0;
}
ResistanceGame.prototype = new lobby.Game();
ResistanceGame.prototype.constructor = ResistanceGame;

ResistanceGame.prototype.getNextLeader = function() {
  var cur_leader = this.getCurrentMission().leader;
  var player_ids = _.keys(this.players);
  var idx = _.indexOf(player_ids, cur_leader.id);
  var num_players = _.size(player_ids);
  var next_idx = (idx + 1) % num_players;
  var next_id = player_ids[next_idx];
  return this.players[next_id];
}

ResistanceGame.prototype.getPublicData = function() {
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
    // i have no fucking idea
    missions : _.map(
      this.missions, function(mission) {
        return mission.getData();
      }
    ),
    state : this.state
  };
}

ResistanceGame.prototype.getKnownData = function(player_id) {
  var ret = this.getPublicData();
  var is_spy = _.contains(this.spies, player_id);
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
}

ResistanceGame.prototype.getInnerState = function() {
  var cur_mission = this.getCurrentMission();
  if (!cur_mission || cur_mission.state == M_STATE.finished) {
    return this.state;
  } else {
    return cur_mission.state;
  }
}

ResistanceGame.prototype.getCurrentMission = function() {
  return _.last(this.missions);
}

ResistanceGame.prototype.choosePlayerForMission = function(leader, player) {
  this.assertState(M_STATE.CHOOSING_MISSION);
  this.assertPlayerIsLeader(leader);
  this.assertPlayerInGame(player);

  var mission = this.getCurrentMission();
  if (mission.partySize() >= mission.missionSize(leader.game)) {
    throw new Error('Cannot choose more players for this mission');
  }

  mission.party[player.id] = player;
}

ResistanceGame.prototype.unchoosePlayerForMission = function(leader, player) {
  this.assertState(M_STATE.CHOOSING_MISSION);
  this.assertPlayerIsLeader(leader);
  this.assertPlayerInGame(player);

  var mission = this.getCurrentMission();
  delete mission.party[player.id];
}

ResistanceGame.prototype.callMissionPartyToVote = function(leader) {
  this.assertState(M_STATE.CHOOSING_MISSION);
  this.assertPlayerIsLeader(leader);
  var mission = this.getCurrentMission();
  if (mission.partySize() != mission.missionSize(this)) {
    throw new Error('Mission party must be size ' + mission.missionSize(this));
  }
  this.getCurrentMission().state = M_STATE.VOTING;
}

ResistanceGame.prototype.startGame = function(creator) {
  this.assertState(lobby.G_STATE.FINDING_PLAYERS);
  this.assertPlayerIsCreator(creator);
  var num_players = _.size(this.players);
  var num_spies = NUM_SPIES[num_players];
  var player_ids = _.keys(this.players);
  player_ids = _.shuffle(player_ids);
  for (var i = 0; i < num_spies; i++) {
    this.spies.push(player_ids[i]);
  }
  var leader_idx = Math.floor(Math.random() * num_players);
  this.missions.push(new Mission(1, 1, this.players[player_ids[leader_idx]]));
  this.getCurrentMission().state = M_STATE.CHOOSING_MISSION;
  this.state = lobby.G_STATE.PLAYING;
}

ResistanceGame.prototype.vote = function(player, vote) {
  this.assertState(M_STATE.VOTING);
  this.assertPlayerInGame(player);
  var votes =  player.game.current_votes;
  votes[player.id] = vote;
  if (_.size(votes) == _.size(player.game.players)) {
    this.resolveVote(player.game);
  }
}

ResistanceGame.prototype.resolveVote = function() {
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
      current_mission.state = M_STATE.FINISHED;
      this.missions.push(
        new Mission(
          current_mission.turn, current_mission.attempt + 1,
          this.getNextLeader()));
      this.getCurrentMission().state = M_STATE.CHOOSING_MISSION;
    }
  } else {
    this.current_actions = {};
    this.getCurrentMission().state = M_STATE.MISSIONING;
  }
}

ResistanceGame.prototype.missionAct = function(player, action) {
  this.assertState(M_STATE.MISSIONING);
  this.assertPlayerOnMission(player);
  var mission = this.getCurrentMission();
  this.current_actions[player.id] = action;
  if (_.size(this.current_actions) == mission.missionSize(this)) {
    this.resolveMission(player.game);
  }
}

ResistanceGame.prototype.resolveMission = function() {
  var actions = this.current_actions;
  var current_mission = this.getCurrentMission();
  current_mission.mission_actions = actions;
  var fails = 0;
  _.each(
    actions,
    function(action) {
      fails += ACTION.FAIL;
    }
  );

  var pass = fails <
    ((current_mission.turn == 4 && _.size(this.players) > 6) ? 2 : 1);

  if (pass) {
    this.passes += 1;
  } else {
    this.fails += 1;
  }

  var game_over = this.passes >= 3 || this.fails >= 3;
  if (!game_over) {
    current_mission.state = M_STATE.FINISHED;
    this.missions.push(
      new Mission(current_mission.turn + 1, 1, this.getNextLeader()));
    this.getCurrentMission().state = M_STATE.CHOOSING_MISSION;
  } else {
    this.endGame(this.passes == 3 ? ROLE.RESISTANCE : ROLE.SPY);
  }
}

ResistanceGame.prototype.endGame = function(winner) {
  // todo inheritance?
  this.getCurrentMission().state = M_STATE.FINSIHSED;
  this.finished = true;
}

// validation

ResistanceGame.prototype.assertPlayerIsLeader = function(leader) {
  this.assertPlayerInGame(leader);
  var mission = this.getCurrentMission();
  if (mission.leader.id != leader.id) {
    throw new Error('User must be leader');
  }
}

ResistanceGame.prototype.assertPlayerOnMission = function(player) {
  this.assertPlayerInGame(player);
  var mission = this.getCurrentMission();
  if (!_.contains(mission.party, player)) {
    throw new Error('User must be on mission');
  }
}

ResistanceGame.prototype.assertState = function(state) {
  if (this.getInnerState() != state) {
    throw new Error('Game must be in state ' + state);
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

var M_STATE = {
  CHOOSING_MISSION : 'choosing_mission',
  VOTING : 'voting',
  MISSIONING : 'missioning',
  FINISHED : 'finished'
}

var ROLE = {
  SPY : 'spy',
  RESISTANCE : 'resistance'
};


var VOTE = {
  YES : 'yes',
  NO : 'no'
}

var ACTION = {
  PASS : 'pass',
  FAIL : 'fail'
}

module.exports = {
  Mission : Mission,
  ResistanceGame : ResistanceGame,
  M_STATE : M_STATE
}
