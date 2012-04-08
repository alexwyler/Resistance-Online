var _ = require('underscore')._;
var Backbone = require('backbone');
var GameList = require('./Game').GameList;

var ClientState = exports.ClientState = Backbone.Model.extend({
  defaults: {
    my_id: null,
    loggedin: false,
    accessToken: null,
    signedRequest: null
  },

  initialize: function(options) {
    this.socket = options.socket;
    this.allGames = new GameList();
    this.game = null;
  },

  login: function(info) {
    if (info.status == "connected") {
      this.set('signedRequest', info.authResponse.signedRequest);
      this.set('accessToken', info.authResponse.accessToken);
      this.set('my_id', info.authResponse.userID);
      this.socket.emit('init', { auth: this.getAuthInfo() });
      this.trigger('login');
    }
  },

  createGame: function() {
    this.socket.emit('new_game');
  },

  joinGame: function(id) {
    this.socket.emit('join_game', id);
  },

  leaveGame: function() {
    this.game = null;
    this.socket.emit('leave_game');
  },

  didJoinGame: function(game) {
    this.game = game;
    this.trigger('join_game', this.game);
  },

  didLeaveGame: function() {
    this.game = null;
    this.trigger('leave_game');
  },

  getAuthInfo: function() {
    return {
      id: this.get('my_id'),
      accessToken: this.get('accessToken'),
      signedRequest: this.get('signedRequest')
    };
  }

});
