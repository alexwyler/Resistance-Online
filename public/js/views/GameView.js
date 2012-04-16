var Backbone = require('backbone');
var constants = require('../constants');
var _ = require('underscore')._;

var MissionListView = require('./MissionView').MissionListView;
var PregameView = require('./PregameView').PregameView;

var GameView = exports.GameView = Backbone.View.extend({
  className: 'game-view',

  events: {
    'click .splash button': 'dismissSplash'
  },

  initialize: function() {
    _(this).bindAll();

    this._missionListView = new MissionListView({
      collection: this.model.game.missions
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

    this.$el.append(this._subview.render().el);

    this.$el.append('<div class="splash">'
                    + '<div class="splash_msg">'
                      + '<div class="splash_txt"></div>'
                      + '<button class="large">okay</button>'
                    + '</div>'
                  + '</div>');
    return this;
  },

  dismissSplash: function() {
    $(".splash").removeClass();
  },                                                         

  showSplash: function(msg) {
    $(".splash_txt").html(msg);
    $(".splash").addClass("active");
  }                                                         
});