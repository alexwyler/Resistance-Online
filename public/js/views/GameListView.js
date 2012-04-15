var Backbone = require('backbone');
var CollectionView = require('./CollectionView').CollectionView;

var GameListItemView = exports.GameListItemView = Backbone.View.extend({
  tagName: 'li',
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

var EmptyGameListView = exports.EmptyGameListView = Backbone.View.extend({
  tagName: 'li',

  render: function() {
    this.$el.html('<div class="large">No games currently</div>');
  }
});

exports.GameListView = CollectionView.extend({
  tagName: 'ul',

  createView: function(game) {
    return new GameListItemView({
      model: game,
      clientState: this.options.clientState
    });
  },

  createPlaceholder: function() {
    return new EmptyGameListView();
  }
});
