var Backbone = require('backbone-extensions');
var G_STATE = require('constants').G_STATE;
var MISSION_STATES = require('constants').MISSION_STATES;

var PlayerList = require('./Player').PlayerList;

var Vote = exports.Vote = Backbone.Model.extend({
  defaults: {
    user_id: null,
    in_favor: null
  }
});

var VoteList = exports.VoteList = Backbone.Collection.extend({
  model: Vote
});

var MissionAction = exports.MissionAction = Backbone.Model.extend({
  defaults: {
    user_id: null,
    mission_action: null
  }
});

var MissionActionList = exports.MissionActionList = Backbone.Model.extend({
  model: Mission
});

var Mission = exports.Mission = Backbone.Model.extend({
  defaults: {
    turn: null,
    attempt: null,
    leader_id: null,
    state : null
  },

  constructor: function() {
    this.party = new PlayerList();
    this.votes = new VoteList();
    this.actions = new MissionActionList();

    Backbone.Model.apply(this, arguments);
  },

  parse: function(data) {
    this.parseCollection(data, 'party');
    this.parseCollection(data, 'votes');
    this.parseCollection(data, 'actions');
    return data;
  },

  compareTo: function(other) {
    if (this.get('turn') != other.get('turn')) {
      return other.get('turn') - this.get('turn');
    }
    return other.get('attempt') - this.get('attempt');
  },

  getLeader: function() {
    return this.game.players.get(this.get('leader_id'));
  },

  addToParty: function(player) {
    socket.emit('choose_player', player.id);
  },

  removeFromParty: function(player) {
    socket.emit('unchoose_player', player.id);
  },

  startVote: function() {
    socket.emit('start_vote');
  },

  isPassing: function() {
    // XXX(rpatterson): handle the special 4th mission
    return this.actions.all(function(action) {
      action.get('mission_action') == ACTION.PASS;
    });
  },

  isClientLeader: function() {
    return this.get('leader_id') == this.game.self.id;
  },

  /**
   * Calculate the state that this mission view is currently in, based on the
   * local player and the game's state.
   */
  getState: function() {
    var game_state = this.game.get('state');
    var local_player = this.game.self;
    var relation_to_current_mission =
      this.compareTo(this.game.getCurrentMission());

    // Is this a future mission?
    if (relation_to_current_mission != 0 &&
        this.votes.length == 0) {
      return MISSION_STATES.FUTURE;

    // Is this a previous, skipped mission?
    } else if (relation_to_current_mission != 0 &&
               this.actions.length == 0) {
      return MISSION_STATES.SKIPPED;

    // Is this a previous, passed mission?
    } else if (relation_to_current_mission != 0 &&
               this.isPassing()) {
      return MISSION_STATES.PASSED;

    // Is this a previous, failed mission?
    } else if (relation_to_current_mission != 0 &&
               !this.isPassing()) {
      return MISSION_STATES.FAILED;

    // Are we the leader, choosing people?
    } else if (game_state == G_STATE.CHOOSING_MISSION &&
               this.getLeader() == local_player) {
      return MISSION_STATES.CHOOSING_PEOPLE;

    // Are we waiting for the leader to choose people?
    } else if (game_state == G_STATE.CHOOSING_MISSION) {
      return MISSION_STATES.WAITING_FOR_PEOPLE;

    // Are we voting on the proposal?
    } else if (game_state == G_STATE.VOTING) {
        return MISSION_STATES.VOTING;

    // Are we on this mission?
    } else if (game_state == G_STATE.MISSIONING &&
               this.people.get(local_player.id)) {
      return MISSION_STATES.ON_MISSION;

    // We must be waiting for the mission results
    } else {
      return MISSION_STATES.WAITING_FOR_RESULTS;
    }
  },
});

var MissionList = exports.MissionList = Backbone.Collection.extend({
  model: Mission
});
