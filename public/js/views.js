var RosterView = CollectionView.extend({
  tagName: 'ul',
  className: 'roster_view',

  createView: function(player) {
    return new PlayerIconView({
      model: player,
      tagName: 'li'
    });
  },

  createPlaceholder: function() {
    return new PlayerIconView({
      model: new Player(),
      tagName: 'li'
    });
  }
});

var GameView = Backbone.View.extend({
  className: 'viewport',
  events: {
    'click #start_game' : 'startGame'
  },

  initialize: function() {
    _(this).bindAll('updateStartButton');
    this._rosterView = new RosterView({
      collection: this.model.game.players
    });
    this._missionListView = new MissionListView({
      collection: this.model.game.missions
    });

    this.model.game.players.on('add remove reset', this.updateStartButton);

    this.model.game.on('change', _(function() {
      this.$el.addClass(this.model.game.get('state'));
    }).bind(this));

  },

  startGame : function() {
    this.model.game.startGame();
  },

  updateStartButton : function() {
    if (this.model.get('my_id') == this.model.game.get('creator')
        && this.model.game.players.length > 0
        && this.model.game.get('state') == G_STATE.FINDING_PLAYERS) {
      this.startButton.show();
    } else {
      this.startButton.hide();
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
    this.$el.addClass(this.model.game.get('state'));
    this.$el.append(this._rosterView.render().el);
    this.$el.append($('<hr/>'));
    this.$el.append(this._missionListView.render().el);
    this.startButton =
      $('<div id="start_game" class="button title layer accept full center">' +
        'Start Game' +
        '</div>'
       );
    this.$el.append(this.startButton);
    this.updateStartButton();
    return this;
  }
});
