var _ = require('underscore');
var lobby = require('./lobby');

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

function ResistanceGame(game_id, creator_id) {
  lobby.Game.call(this, game_id, creator_id);
  this.state = null;
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
  return this.players[((idx+1) % _.size(player_ids))];
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

ResistanceGame.prototype.getCurrentMission = function() {
  return _.last(this.missions);
}

ResistanceGame.prototype.choosePlayerForMission = function(leader, user) {
  this.assertState(G_STATE.CHOOSING_MISSION);
  this.assertPlayerIsLeader(leader);
  this.assertPlayerInGame(user);

  var mission = this.getCurrentMission();
  if (mission.partySize() >= mission.missionSize()) {
    throw new Error('Cannot choose more players for this mission');
  }

  mission.party[data.player.id] = data.player;
}


ResistanceGame.prototype.unchoosePlayerForMission = function(leader, player) {
  this.assertState(G_STATE.CHOOSING_MISSION);
  this.assertPlayerIsLeader(leader);
  this.assertPlayerInGame(player);

  var mission = this.getCurrentMission();
  delete mission.party[data.player.id];
}

ResistanceGame.prototype.callMissionPartyToVote = function(leader) {
  this.assertState(G_STATE.CHOOSING_MISSION);
  this.assertPlayerIsLeader(leader);
  var mission = this.getCurrentMission();
  if (mission.partySize() != mission.missionSize()) {
    throw new Error('Mission party must be size ' + mission.missionSize());
  }
  leader.game.state = G_STATE.VOTING;
}

ResistanceGame.prototype.startGame = function(creator) {
  this.assertState(G_STATE.FINDING_PLAYERS);
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
  this.state = G_STATE.CHOOSING_MISSION;
}

ResistanceGame.vote = function(player, vote) {
  this.assertState(G_STATE.VOTING);
  this.assertPlayerInGame(player);
  var votes =  player.game.current_votes;
  votes[player.id] = vote;
  if (_.size(votes) == _.size(player.game.players)) {
    this.resolveVote(player.game);
  }
}

ResistanceGame.resolveVote = function() {
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

ResistanceGame.prototype.missionAct = function(player, action) {
  this.assertState(G_STATE.MISSIONING);
  this.assertUserOnMission(player);
  current_actions[player.id] = action;
  if (_.size(current_actions) == mission.missionSize()) {
    this.resolveMission(player.game);
  }
}

ResistanceGame.prototype.resolveMission = function() {
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

  var pass = fails <
    ((current_mission.turn == 4 && _.size(this.players) > 6) ? 2 : 1);

  if (pass) {
    this.passes += 1;
  } else {
    this.fails += 1;
  }

  var game_over = passes >= 3 || fails >= 3;
  if (!game_over) {
    this.missions.push(
      new Mission(current_mission.turn + 1, 1, this.getNextLeader()));
    this.state = G_STATE.CHOOSING_MISSION;
  } else {
    this.endGame(this.passes == 3 ? ROLE.RESISTANCE : ROLE.SPY);
  }
}

// validation

ResistanceGame.prototype.assertPlayerIsLeader = function(leader) {
  this.assertPlayerInGame(leader);
  var mission = this.getCurrentMission();
  if (mission.leader.id != leader.id) {
    throw new Error('User must be leader');
  }
}

ResistanceGame.prototype.assertUserOnMission = function(player) {
  this.assertPlayerInGame(player);
  var mission = this.getCurrentMission();
  if (!_.contains(mission.party, player)) {
    throw new Error('User must be on mission');
  }
}

ResistanceGame.prototype.assertState = function(state) {
  if (this.state != state) {
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
  ResistanceGame : ResistanceGame
}
