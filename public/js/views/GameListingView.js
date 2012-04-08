var Backbone = require('backbone');
var FacepileView = require('./FacepileView').FacepileView;

exports.GameListingView = Backbone.View.extend({
  className: 'info_view selectable',

  events: {
    'click': 'joinGame'
  },

  initialize: function() {
    this._facepileView = new FacepileView({ collection: this.model.players });
  },

  render: function() {
    this.$el.append('<span class="large">Game ' + this.model.get('id') + '</span>');
    this.$el.append(this._facepileView.render().el);
  },

  joinGame: function() {
    this.options.clientState.joinGame(this.model.get('id'));
  }
});
