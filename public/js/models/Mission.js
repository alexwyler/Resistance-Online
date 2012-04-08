var Backbone = require('backbone-extensions');
var G_STATE = require('constants').G_STATE;
var M_STATE = require('constants').M_STATE;
var MV_STATE = require('constants').MV_STATE;
var MISSION_SIZE = require('constants').MISSION_SIZE;

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
    state: null
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

  castVote: function(vote) {
    socket.emit('vote', vote);
  },

  isPassing: function() {
    // XXX(rpatterson): handle the special 4th mission
    return this.actions.all(function(action) {
      action.get('mission_action') == ACTION.PASS;
    });
  },

  getPartySize: function() {
    return MISSION_SIZE[this.game.players.length][this.get('turn') - 1];
  }

});

var MissionList = exports.MissionList = Backbone.Collection.extend({
  model: Mission
});
