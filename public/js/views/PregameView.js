var Backbone = require('backbone');
var _ = require('underscore')._;

var FacepileView = require('./FacepileView').FacepileView;

var PregameView = exports.PregameView = Backbone.View.extend({
  className: 'pregame-view',

  initialize: function() {
    _(this).bindAll();

    this._playersView = new FacepileView({
      collection: this.model.game.players
    });

    this.model.game.on('change', this.render);
  },

  clickStartGame: function() {
    this.model.game.getClientState().socket.emit('start_game');
  },

  render: function() {
    this.$el.empty();
    this.$el.append('<div class="large">Current Players:</div>');
    this.$el.append(this._playersView.render().el);

    var pregame_status = null;
    if (this.model.game.amICreator()) {
      pregame_status = 'You are the game creator! Press start when ready.';
    } else {
      pregame_status = 'Waiting for game creator.';
    }

    this.$el.prepend(
      $(
        '<div class="status">' +
          pregame_status +
          '</div>'
      )
    );

    if (this.model.game.amICreator()) {
      this.$el.append(
        $(
          '<button id="start_game" class="bottom large full center">' +
            'Start Game' +
          '</button>'
        ).click(this.clickStartGame)
      );
    }
    return this;
  }
});
