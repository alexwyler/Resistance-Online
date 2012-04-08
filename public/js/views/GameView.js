var Backbone = require('backbone');
var _ = require('underscore')._;

var MissionListView = require('./MissionView').MissionListView;

var GameView = exports.GameView = Backbone.View.extend({
  initialize: function() {
    this._missionListView = new MissionListView({
      collection: this.model.game.missions
    });

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
    return this;
  }
});
