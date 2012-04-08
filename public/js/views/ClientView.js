var Backbone = require('backbone');
var _ = require('underscore')._;
var LoginView = require('./LoginView').LoginView;
var LobbyView = require('./LobbyView').LobbyView;
var GameView = require('./GameView').GameView;
var ErrorView = require('./ErrorView').ErrorView;

exports.ClientView = Backbone.View.extend(
  {
    initialize: function() {
      _(this).bindAll();
      this.currentView = new LoginView();

      this.model.on('login', this.handleLogin);
      this.model.on('join_game', this.setGame);
      this.model.on('leave_game', this.handleLogin);
      this.model.on('error', this.handleError);
    },

    render: function() {
      this.$el.html(this.currentView.render().el);
    },

    handleLogin: function() {
      this.currentView = new LobbyView({ model: this.model });
      this.render();
    },

    setGame: function(game) {
      this.currentView = new GameView({ model: this.model });
      this.render();
    },

    handleError: function(error) {
      this.currentView = new ErrorView({ error: error.msg });
      this.render();
    }
  }
);
