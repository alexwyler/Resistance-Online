var Backbone = require('backbone');
var GameListView = require('./GameListView').GameListView;

exports.LobbyView = Backbone.View.extend({
  className: 'lobby-view',

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
      '<div class="navigator center title layer">',
        '<div class="title">Games Lobby</div>',
      '</div>',
      '<button id="new_game" class="bottom large full center">New Game</button>'
    ].join(''));

    this.$('.navigator').after(this.gamesList.render().el);
    return this;
  },

  newGame: function() {
    this.model.createGame();
  }
});

