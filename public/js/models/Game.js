var _ = require('underscore')._;
var Backbone = require('backbone-extensions');

var PlayerList = require('./Player').PlayerList;
var MissionList = require('./Mission').MissionList;
var ClientAwareModel = require('./ClientAwareModel').ClientAwareModel;

var Game = exports.Game = ClientAwareModel.extend({
  defaults: {
    id: null,
    creator: null,
    roles: null,
    passes: null,
    fails: null,
    state: ''
  },

  constructor: function() {
    _(this).bindAll();

    this.players = new PlayerList();
    this.missions = new MissionList();
    this.known_roles = false; // TODO

    this.players.on('add', this._addItem);
    this.missions.on('add', this._addItem);

    return Backbone.Model.apply(this, arguments);
  },

  parse: function(data) {
    this.parseCollection(data, 'players');
    this.parseCollection(data, 'missions');
    return data;
  },

  startGame: function() {
    socket.emit('start_game');
  },

  leaveGame: function() {
    socket.emit('leave_game');
  },

  getCurrentMission: function() {
    if (this.get('state') == G_STATE.FINISHED) {
      return null;
    } else {
      return this.missions.at(this.missions.length - 1);
    }
  },

  // todo: instead of the canonical player object references living in
  // game, move them to an external map.  A game should have ids that can be
  // exchanged for real player models.
  getSelf: function() {
    return this.players.get(this.getClientID());
  },

  /**
   * Called when players or missions are added to this game.
   */
  _addItem: function(item) {
    item.game = this;
  },

  getCurrentMission: function() {
    return this.missions.last();
  }
});

var GameList = exports.GameList = Backbone.Collection.extend({
  model: Game
});

