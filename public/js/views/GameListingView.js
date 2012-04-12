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
    this.$el.append('<div class="large">Game ' + this.model.get('id') + '</div>');
    this.$el.append('<div class="float-left">&nbsp&nbsp players: &nbsp');
    this.$el.append(this._facepileView.render().el);
    this.$el.append('</div>');
  },

  joinGame: function() {
    this.options.clientState.joinGame(this.model.get('id'));
  }
});
