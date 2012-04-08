var Backbone = require('backbone');
var GameListView = require('./GameListView').GameListView;

exports.LobbyView = Backbone.View.extend({
  events: {
    'click #new_game': 'newGame'
  },

  initialize: function() {
    this.gamesList = new GameListView({
      collection: this.model.allGames,
      clientState: this.model
    });
  },

  render: function() {
    this.$el.html([
      '<div id="lobby_view" class="viewport center">',
        '<div class="navigator center title layer">',
          '<div class="title">Games Lobby</div>',
        '</div>',
        '<div id="new_game" class="button title layer accept full">New Game</div>',
      '</div>',
    ].join(''));

    this.$('.navigator').after(this.gamesList.render().el);
    return this;
  },

  newGame: function() {
    this.model.createGame();
  }
});
