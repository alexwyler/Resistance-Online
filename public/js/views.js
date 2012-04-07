var SelectPlayerRowView = PlayerIconView.extend({
  tagName: 'li',
  className: 'player_choice',

  initialize: function() {
    _(this).bindAll('render', 'updateSelection');
    this.options.selection.on('change add remove', this.updateSelection);
    this.render();
    this.updateSelection();
  },

  updateSelection: function() {
    this.$el.unbind();
    if (this.options.selection.get(this.model.id)) {
      this.$el
        .addClass('selected')
        .click(this.options.onDeSelect);
    } else {
      this.$el
        .removeClass('selected')
        .click(this.options.onSelect);
    }
    this.render();
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

    this.model.on('change', this.updateSubView);

    if (this.model.isClientLeader()) {
      this._choosePartyView = new ChoosePartyView({
        model: this.model
      });
    }

   this._missionSummaryView = new MissionSummaryView({
      model: this.model
    });

    this._missionActView = new MissionActView({
      model: this.model
    });

    this._missionVoteView = new MissionVoteView({
      model : this.model
    });
  },

  updateSubView : function() {
    var state = this.model.get('state');
    var am_leader = this.model.isClientLeader();

    if (state == M_STATE.CHOOSING_MISSION && am_leader) {
      this._subView = this._choosePartyView;
    } else if (state == M_STATE.VOTING) {
      this._subView = this._missionVoteView;
    } else if (state == M_STATE.MISSIONING
               && this.model.isClientOnMission()) {
      this._subView = this._missionActView;
    } else {
      this._subView = this._missionSummaryView;
    }
  },

  render: function() {
    this.$el.empty();
    this.updateSubView();
    this._subView.render();
    this.$el.append(this._subView.el);
    return this;
  }
});

var MissionActView = Backbone.View.extend({
  render: function() {
    this.$el.html('Mission Time');
    return this;
  }
});

var MissionVoteView = Backbone.View.extend({
  render: function() {
    this.$el.html('Voting Time');
    return this;
  }
});


var MissionSummaryView = Backbone.View.extend({
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
    return this;
  }
});

var ChoosePartyView = Backbone.View.extend({
  initialize: function() {
    _(this).bindAll();

    this._choiceList = new PartyChoicesList({
      mission: this.model,
      collection: this.model.game.players
    });

    this.model.party.on("add remove change", this.updateLockInButton);
    this._lockInButton =
      $('<div class="start_vote button title layer accept full center">' +
        'Force a Vote' +
        '</div>'
       ).click(function() {
         this.model.startVote()
       }.bind(this))
      .hide();
  },

  updateLockInButton: function() {
    if (this.model.party.size() ==
        MISSION_SIZE[this.model.game.players.size()][this.model.get('turn')]
       ) {
      this._lockInButton.show();
    } else {
      this._lockInButton.hide();
    }
  },

  render: function() {
    this.updateLockInButton();
    this.$el.empty();
    this.$el.append(this._choiceList.render().el);
    this.$el.append(this._lockInButton);
    return this;
  }
});

var PartyChoicesList = CollectionView.extend({
  tagName: 'ul',
  className: 'choose_party',

  createView: function(player) {
    return new SelectPlayerRowView({
      model : player,
      selection : this.options.mission.party,
      onSelect : function() {
        this.options.mission.addToParty(player);
      }.bind(this),
      onDeSelect : function() {
        this.options.mission.removeFromParty(player);
      }.bind(this)
    })
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
