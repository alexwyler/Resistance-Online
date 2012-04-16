var Backbone = require('backbone');
var constants = require('../constants');
var _ = require('underscore')._;

var MissionListView = require('./MissionView').MissionListView;
var PregameView = require('./PregameView').PregameView;
var ScoreHeaderView = require('./ScoreHeaderView').ScoreHeaderView;

var GameView = exports.GameView = Backbone.View.extend({
  className: 'game-view',

  initialize: function() {
    _(this).bindAll();

    this._missionListView = new MissionListView({
      collection: this.model.game.missions
    });

    this._scoreHeaderView = new ScoreHeaderView({
      model : this.model
    });

    this._pregameView = new PregameView({
      model: this.model
    });

    this.model.game.on('change', this.updateSubview);
    this.updateSubview();
  },

  updateSubview: function() {
    if (this.model.game.get('state') == constants.G_STATE.FINDING_PLAYERS) {
      this._subview = this._pregameView;
    } else {
      this._subview = this._missionListView;
    }
    this.render();
  },

  render: function() {

    this.$el.empty();
    this.$el.append(this._scoreHeaderView.render().el);
    this.$el.append(this._subview.render().el);
    return this;
  }
});