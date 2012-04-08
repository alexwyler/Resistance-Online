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

  initialize: function() {
    _(this).bindAll('login', 'getAuthInfo');
    this.allGames = new GameList();
    this.game = null;
  },

  login: function(info) {
    if (info.status == "connected") {
      this.set('signedRequest', info.authResponse.signedRequest);
      this.set('accessToken', info.authResponse.accessToken);
      my_id = info.authResponse.userID;
      this.set('my_id', info.authResponse.userID);
      this.trigger('login');
    }
  },

  createGame: function() {
    socket.emit('new_game');
  },

  joinGame: function(id) {
    socket.emit('join_game', id);
  },

  leaveGame: function() {
    this.game = null;
    socket.emit('leave_game');
  },

  didJoinGame: function(game) {
    this.game = game;
    this.game.set('local_player_id', this.get('my_id'));
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
