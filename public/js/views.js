var PlayerIconView = Backbone.View.extend({
  tagName: 'div',
  className: 'player-icon',

  render: function() {
    this.$el.html('<img src="' + this.model.get('profile_pic') + '" /> ' + this.model.get('name'));
    return this;
  }
});

var RosterView = Backbone.View.extend({
  tagName: 'ul',

  initialize: function() {
    _(this).bindAll('addPlayer', 'removePlayer');
    this._views = [];

    this.collection.each(this.addPlayer);
    this.collection.on('add', this.addPlayer);
    this.collection.on('remove', this.removePlayer);
  },

  addPlayer: function(player) {
    var view = new PlayerIconView({
      model: player,
      tagName: 'li'
    });
    this._views.push(view);
    this.$el.append(view.render().el);
    return this;
  },

  removePlayer: function(player) {
    var viewToRemove = _(this._views).select(function (child) {
      return child.model === player;
    })[0];
    this._views = _(this._views).without(viewToRemove);
    viewToRemove.$el.remove();
  },

  render: function() {
    var me = this;
    this.$el.html('');
    _(this._views).each(function(child) {
      me.$el.append(child.render().el);
    });
    return this;
  }
});

var GameView = Backbone.View.extend({
  initialize: function() {
    this._roster = new RosterView({
      collection: this.model.players
    });
    this.render();
  },

  render: function() {
    this.$el.append(this._roster.render().el);
  }
});

$(document).ready(function() {
  var app = new GameView({
    model: game,
    el: $('body')
  });
});
