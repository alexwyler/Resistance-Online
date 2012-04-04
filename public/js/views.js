var CollectionView = Backbone.View.extend({
  initialize: function() {
    _(this).bindAll('addItem', 'removeItem', 'resetItems');
    this._views = [];

    if (this.options.minimumSize > 0) {
      for (var i = 0; i < this.options.minimumSize; i++) {
        this._views.push(this.createPlaceholder());
      }
    }

    this.collection.each(this.addItem);
    this.collection.on('add', this.addItem);
    this.collection.on('remove', this.removeItem);
    this.collection.on('reset', this.resetItems);
  },

  addItem: function(item) {
    var view = this.createView(item);
    view.render();
    if (this.collection.length <= this.options.minimumSize) {
      this._views.splice(this.collection.length - 1, 0, view);
      this.el.insertBefore(view.el, this._views[this.collection.length].el);
      var placeholder = this._views.pop();
      placeholder.remove();
    } else {
      this._views.push(view);
      this.$el.append(view.el);
    }
    return this;
  },

  removeItem: function(item) {
    var viewToRemove = _(this._views).select(function (child) {
      return child.model === item;
    })[0];
    this._views = _(this._views).without(viewToRemove);
    viewToRemove.$el.remove();
    if (this.collection.length < this.options.minimumSize) {
      var placeholder = this.createPlaceholder();
      this._views.push(placeholder);
      placeholder.render();
      this.$el.append(placeholder.el);
    }
  },

  resetItems: function() {
    _(this._views).each(function(view) {
      view.remove();
    });
   this._views = [];
   this.collection.each(this.addItem);
  },

  render: function() {
    var me = this;
    _(this._views).each(function(child) {
      child.render();
      me.$el.append(child.el);
    });
    return this;
  },

  createView: function(model) {
    return new Backbone.View({
      model: model
    });
  },

  createPlaceholder: function() {
    return new Backbone.View();
  }
});

var PlayerIconView = Backbone.View.extend({
  tagName: 'span',
  className: 'person',

  initialize: function() {
    _(this).bindAll('render');
    this.model.on('change', this.render);
  },

  render: function() {
    var template = '<img src="{{profile_pic}}" /> {{name}}';
    this.$el.html(Mustache.render(template, this.model.attributes));
    return this;
  }
});

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

var FacepileView = CollectionView.extend({
  className: 'facepile',

  createView: function(player) {
    return new FacepileView.ItemView({
      model: player
    });
  },

  createPlaceholder: function() {
    return new FacepileView.PlaceholderView();
  }
}, {
  ItemView: Backbone.View.extend({
    tagName: 'span',
    className: 'person',

    render: function() {
      var template = '<img src="{{profile_pic}}" />';
      this.$el.html(Mustache.render(template, this.model.attributes));
      return this;
    }
  }),

  PlaceholderView: Backbone.View.extend({
    tagName: 'span',
    className: 'person placeholder',

    render: function() {
      return this;
    }
  })
});

/**
 * Renders the status part of a particular mission.
 */
var MissionStatusView = Backbone.View.extend({
  className: 'status',

  initialize: function() {
    _(this).bindAll();
  },

  render: function() {
    var state = this.model.getState();
    if (state == MISSION_STATES.FUTURE) {
      this.$el.html('This mission hasn\'t happened yet.');

    } else if (state == MISSION_STATES.SKIPPED) {
      this.$el.html('This mission was voted down.');

    } else if (state == MISSION_STATES.PASSED) {
      this.$el.html('This mission passed.');

    } else if (state == MISSION_STATES.FAILED) {
      this.$el.html('This mission failed.');

    } else if (state == MISSION_STATES.CHOOSING_PEOPLE) {
      this.$el.html('Choose people for this mission.');

    } else if (state == MISSION_STATES.WAITING_FOR_PEOPLE) {
      this.$el.html(this.model.getLeader().get('name') +
        ' is choosing people for this mission.');

    } else if (state == MISSION_STATES.VOTING) {
      this.$el.html('Vote on this mission.');

    } else if (state == MISSION_STATES.ON_MISSION) {
      this.$el.html('Play your mission action.');

    } else if (state == MISSION_STATES.WAITING_FOR_RESULTS) {
      this.$el.html('Waiting for mission results.');

    }

    return this;
  }
});

var MissionView = Backbone.View.extend({
  className: 'mission',

  initialize: function() {
    _(this).bindAll();

    this.game = this.model.game;

    this._statusView = new MissionStatusView({ model: this.model });
    this._leaderView = new PlayerIconView({ model: this.model.getLeader() });
    this._peopleView = new FacepileView({
      tagName: 'span',
      collection: this.model.party,
      minimumSize: GameInfo.getMissionSize(this.model)
    });

    this.game.on('change', this.refresh);
    this.model.on('change', this.refresh);
    this.model.votes.on('change add remove', this.refresh);
    this.model.actions.on('change add remove', this.refresh);
  },

  refresh: function() {
    this.$el.attr('class', 'mission ' + this.model.getState());
    this._statusView.render();
  },

  render: function() {
    var template = [
      '<div class="attempt">Attempt: {{attempt}}</div>',
      '<div class="leader">Leader: </div>',
      '<div class="people">Mission party: </div>',
      '<div class="votes">Votes: {{up_votes}} OK | {{down_votes}} No</div>',
      '<div class="outcome">Outcome: </div>'
    ].join('');

    var up_votes = this.model.votes.filter(function(v) {
      return v.get('in_favor');
    }).length;

    this.$el.html(Mustache.render(template, {
      attempt: this.model.get('attempt'),
      up_votes: up_votes,
      down_votes: this.model.votes.length - up_votes
    }));
    this.$el.prepend(this._statusView.render().el);
    this.$('div.leader').append(this._leaderView.render().el);
    this.$('div.people').append(this._peopleView.render().el);
    // Votes
    // Mission actions

    this.refresh();
  }
});

var MissionListView = CollectionView.extend({
  className: 'mission-list',

  createView: function(mission) {
    return new MissionView({
      model: mission
    });
  }
})

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
        && this.model.game.players.length > 0) {
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
    this.$el.append(this._missionListView.render().el);
    this.$el.append(this._rosterView.render().el);
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
