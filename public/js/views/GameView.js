var Backbone = require('backbone');
var constants = require('../constants');
var _ = require('underscore')._;

var MissionListView = require('./MissionView').MissionListView;

var GameView = exports.GameView = Backbone.View.extend({
  className: 'game-view',

  initialize: function() {
    _(this).bindAll();
    this._missionListView = new MissionListView({
      collection: this.model.game.missions
    });

    this._startGameButton =
      $(
        '<div id="start_game" class="button title layer accept full">' +
          'Start Game' +
        '</div>'
      ).click(this.clickStartGame);

    this.updateStartButton();
    this.model.game.on('change', this.updateStartButton);
  },

  clickStartGame: function() {
    this.model.game.getClientState().socket.emit('start_game');
  },

  updateStartButton: function() {
    if (this.model.game.get('state') == constants.G_STATE.FINDING_PLAYERS
        && this.model.game.getClientID() == this.model.game.get('creator')) {
      this._startGameButton.show();
    } else {
      this._startGameButton.hide();
    }
  },

  render: function() {
    var template = [
      '<div class="navigation">',
        '<div data-id="1" class="token"></div>',
        '<div data-id="2" class="token"></div>',
        '<div data-id="3" class="token"></div>',
        '<div data-id="4" class="token"></div>',
        '<div data-id="5" class="token"></div>',
      '</div>'
    ].join('');

    this.$el.html(template);
    this.$el.append(this._missionListView.render().el);
    this.$el.append(this._startGameButton);
    return this;
  }
});
