var _ = require('underscore')._;
var Backbone = require('backbone');
var Mustache = require('mustache');
var M_STATE = require('constants').M_STATE;
var MV_STATE = require('constants').MV_STATE;
var VOTE = require('constants').VOTE;
var ACTION = require('constants').ACTION;

var ChoosePeopleView = require('./ChoosePeopleView').ChoosePeopleView;
var CollectionView = require('./CollectionView').CollectionView;
var PlayerIconView = require('./PlayerIconView').PlayerIconView;
var FacepileView = require('./FacepileView').FacepileView;

var MissionActView = Backbone.View.extend({
  className: 'act-view',

  events: {
    'click button': 'doMissionAction'
  },

  render: function() {
    var template =
      '<button class="pass" data-action="{{pass}}">Pass</button>' +
      '<button class="fail" data-action="{{fail}}">Fail</button>';

    this.$el.html(Mustache.render(template, {
      yes: ACTION.PASS,
      no: ACTION.FAIL
    }));

    return this;
  },

  doMissionAction: function(event) {
    var action = event.target.dataset.vote;
    this.model.mission.doMissionAction(action);
  }
});

var MissionVoteView = Backbone.View.extend({
  className: 'vote-view',

  events: {
    'click button': 'castVote'
  },

  render: function() {
    var template =
      '<button class="approve" data-vote="{{yes}}">Approve</button>' +
      '<button class="reject" data-vote="{{no}}">Reject</button>';

    this.$el.html(Mustache.render(template, {
      yes: VOTE.YES,
      no: VOTE.NO
    }));

    return this;
  },

  castVote: function(event) {
    var vote = event.target.dataset.vote;
    this.model.mission.castVote(vote);
  }
});

var MissionViewData = Backbone.Model.extend({
  defaults: {
    state: ''
  },

  initialize: function(options) {
    this.mission = options.mission;
    this.game = this.mission.game;

    this._updateState();

    this.mission.on('change', this._updateState, this);
    this.mission.party.on('change add remove', this._updateState, this);
    this.mission.votes.on('change add remove', this._updateState, this);
    this.mission.actions.on('change add remove', this._updateState, this);
  },

  /**
   * Calculate the state that this mission view is currently in, based on the
   * local player and the game's state.
   */
  _updateState: function() {
    var state = this.mission.get('state');
    var local_player = this.game.getSelf();
    var new_state = MV_STATE.UNKNOWN;

    // Is this a future mission?
    if (state == M_STATE.FINISHED &&
        this.mission.votes.length == 0) {
      new_state = MV_STATE.FUTURE;

    // Is this a previous, skipped mission?
    } else if (state == M_STATE.FINISHED &&
               this.mission.actions.length == 0) {
      new_state = MV_STATE.SKIPPED;

    // Is this a previous, passed mission?
    } else if (state == M_STATE.FINISHED &&
               this.mission.isPassing()) {
      new_state = MV_STATE.PASSED;

    // Is this a previous, failed mission?
    } else if (state == M_STATE.FINISHED &&
               !this.mission.isPassing()) {
      new_state = MV_STATE.FAILED;

    // Are we the leader, choosing people?
    } else if (state == M_STATE.CHOOSING_MISSION &&
               this.mission.getLeader() == local_player) {
      new_state = MV_STATE.CHOOSING_PEOPLE;

    // Are we waiting for the leader to choose people?
    } else if (state == M_STATE.CHOOSING_MISSION) {
      new_state = MV_STATE.WAITING_FOR_PEOPLE;

    // Are we voting on the proposal?
    } else if (state == M_STATE.VOTING) {
      new_state = MV_STATE.VOTING;

    // Are we on this mission?
    } else if (state == M_STATE.MISSIONING &&
               this.mission.party.get(local_player.id)) {
      new_state = MV_STATE.ON_MISSION;

    // We must be waiting for the mission results
    } else if (state == M_STATE.MISSIONING) {
      new_state = MV_STATE.WAITING_FOR_RESULTS;
    }

    this.set('state', new_state);
  },
});

/**
 * Renders the status part of a particular mission.
 */
var MissionStatusView = Backbone.View.extend({
  className: 'status',

  initialize: function() {
    this.mission = this.model.mission;

    this.model.on('change:state', this.update, this);

    this.update();
  },

  update: function() {
    if (this._playerView && this._playerView.model != this.mission.getLeader()) {
      this._playerView.remove();
    }

    this._playerView = new PlayerIconView({
      model: this.mission.getLeader()
    });
  },

  render: function() {
    var state = this.model.get('state');

    if (state == MV_STATE.FUTURE) {
      this.$el.html('This mission hasn\'t happened yet.');

    } else if (state == MV_STATE.SKIPPED) {
      this.$el.html('This mission was voted down.');

    } else if (state == MV_STATE.PASSED) {
      this.$el.html('This mission passed.');

    } else if (state == MV_STATE.FAILED) {
      this.$el.html('This mission failed.');

    } else if (state == MV_STATE.CHOOSING_PEOPLE) {
      this.$el.html('Choose people for this mission.');

    } else if (state == MV_STATE.WAITING_FOR_PEOPLE) {
      this.$el.html(this._playerView.render().el);
      this.$el.append(' is choosing&hellip;');

    } else if (state == MV_STATE.VOTING) {
      this.$el.html('Vote on this mission.');

    } else if (state == MV_STATE.ON_MISSION) {
      this.$el.html('Play your mission action.');

    } else if (state == MV_STATE.WAITING_FOR_RESULTS) {
      this.$el.html('Waiting for mission results.');

    }

    return this;
  }
});

var MissionSummaryView = Backbone.View.extend({
  className: 'summary-view',

  initialize: function() {
    _(this).bindAll();

    this.mission = this.model.mission;
    this.game = this.model.game;

    this._statusView = new MissionStatusView({ model: this.model });
    this._leaderView = new PlayerIconView({
      model: this.model.mission.getLeader()
    });
    this._peopleView = new FacepileView({
      tagName: 'span',
      collection: this.model.mission.party,
      minimumSize: this.mission.getPartySize()
    });

    this.game.on('change', this.render);
    this.model.mission.on('change', this.render);
    this.model.mission.votes.on('change add remove', this.render);
    this.model.mission.actions.on('change add remove', this.render);
  },

  render: function() {
    var template = [
      '<div class="attempt">Attempt: {{attempt}}</div>',
      '<div class="leader">Leader: </div>',
      '<div class="people">Mission party: </div>',
      '<div class="votes">Votes: {{up_votes}} OK | {{down_votes}} No</div>',
      '<div class="outcome">Outcome: </div>'
    ].join('');

    var up_votes = this.model.mission.votes.filter(function(v) {
      return v.get('in_favor');
    }).length;

    this.$el.html(Mustache.render(template, {
      attempt: this.model.get('attempt'),
      up_votes: up_votes,
      down_votes: this.model.mission.votes.length - up_votes
    }));
    this.$el.prepend(this._statusView.render().el);
    this.$('div.leader').append(this._leaderView.render().el);
    this.$('div.people').append(this._peopleView.render().el);
    // Votes
    // Mission actions

    return this;
  }
});

var ChoosePartyView = Backbone.View.extend({
  className: 'choose-party-view',

  events: {
    'click .button': 'startVote'
  },

  initialize: function() {
    this.mission = this.model.mission;

    this.selected_party = new Backbone.Collection(this.mission.party.models);
    this.selected_party.on('add', this.choosePlayer);
    this.selected_party.on('remove', this.unChoosePlayer);

    this._choiceList = new ChoosePeopleView({
      collection: this.model.game.players,
      selection: this.selected_party,
    });

    this.model.mission.party.on("add remove change", this.refresh, this);
  },

  choosePlayer : function(player) {
    socket.emit('choose_player', player.id);
  },

  unChoosePlayer : function(player) {
    socket.emit('unchoose_player', player.id);
  },

  refresh: function() {
    if (this.mission.party.size() == this.mission.getPartySize()) {
      this.$el.addClass('filled');
    } else {
      this.$el.removeClass('filled');
    }
  },

  startVote: function() {
    if (this.mission.party.size() == this.mission.getPartySize()) {
      this.model.mission.startVote();
    }
  },

  render: function() {
    this.refresh();
    this.$el.empty();
    this.$el.append(this._choiceList.render().el);
    this.$el.append($('<div class="wrapper"><div class="button">Vote</div></div>'));
    return this;
  }
});

var MissionView = exports.MissionView = Backbone.View.extend({
  className: 'mission',

  initialize: function() {
    this.model = new MissionViewData({
      mission: this.model
    });

    this.model.on('change', this.refresh, this);

    this._missionSummaryView = new MissionSummaryView({ model: this.model });
    this._choosePartyView = new ChoosePartyView({ model: this.model });
    this._missionVoteView = new MissionVoteView({ model : this.model });
    this._missionActView = new MissionActView({ model: this.model });
  },

  refresh: function() {
    this.$el.attr('class', 'mission ' + this.model.get('state'));
  },

  render: function() {
    this.$el.empty();
    this.refresh();
    this.$el.append(this._missionSummaryView.render().el);
    var control_area = $('<div class="controls"></div>');
    this.$el.append(control_area);
    control_area.append(this._choosePartyView.render().el);
    control_area.append(this._missionVoteView.render().el);
    control_area.append(this._missionActView.render().el);
    return this;
  }
});

var MissionListView = exports.MissionListView = CollectionView.extend({
  className: 'mission-list',

  createView: function(mission) {
    return new MissionView({
      model: mission
    });
  }
})

