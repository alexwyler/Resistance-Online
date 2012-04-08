var _ = require('underscore')._;
var Backbone = require('backbone-extensions');

var PlayerList = require('./Player').PlayerList;
var MissionList = require('./Mission').MissionList;

var Game = exports.Game = Backbone.Model.extend({
  defaults: {
    id: null,
    local_player_id: null,
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

    this.players.on('add', this._checkIfSelf);
    this.players.on('reset', this._findSelf);
    this.on('change:local_player_id', this._findSelf);

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

  getPlayer: function(id) {
    return this.players.find(function(p) {
      return p.id == id;
    });
  },

  getCurrentMission: function() {
    if (this.get('state') == G_STATE.FINISHED) {
      return null;
    } else {
      return this.missions.at(this.missions.length - 1);
    }
  },

  /**
   * Called when players or missions are added to this game.
   */
  _addItem: function(item) {
    item.game = this;
  },

  getCurrentMission: function() {
    return this.missions.last();
  },

  _findSelf: function() {
    this.players.each(this._checkIfSelf);
  },

  _checkIfSelf: function(player) {
    // todo (awyler) rethink this.get('local_player_id')
    if (this.get('local_player_id') == player.get('id')) {
      this.self = player;
    }
  }
});

var GameList = exports.GameList = Backbone.Collection.extend({
  model: Game
});

