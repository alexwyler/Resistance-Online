var CollectionView = Backbone.View.extend({
  initialize: function() {
    _(this).bindAll('addItem', 'removeItem');
    this._views = [];

    this.collection.each(this.addItem);
    this.collection.on('add', this.addItem);
    this.collection.on('remove', this.removeItem);
  },

  addItem: function(item) {
    var view = this.createView(item);
    this._views.push(view);
    view.render();
    this.$el.append(view.el);
    return this;
  },

  removeItem: function(item) {
    var viewToRemove = _(this._views).select(function (child) {
      return child.model === item;
    })[0];
    this._views = _(this._views).without(viewToRemove);
    viewToRemove.$el.remove();
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
  }
});

var PlayerIconView = Backbone.View.extend({
  tagName: 'div',
  className: 'player-icon',

  render: function() {
    this.$el.html('<img src="' + this.model.get('profile_pic') + '" /> ' +
      this.model.get('name'));
    return this;
  }
});

var RosterView = CollectionView.extend({
  tagName: 'ul',

  createView: function(player) {
    return new PlayerIconView({
      model: player,
      tagName: 'li'
    });
  }
});

var MissionView = Backbone.View.extend({
  initialize: function() {
    this._leaderView = new PlayerIconView({
      model: this.model.getLeader()
    });
  },

  render: function() {
    this.$el.append('Leader:');
    this.$el.append(this._leaderView.render().el);
    // Attempt
    // People
    // Votes
    // Mission actions
  }
});

var MissionListView = CollectionView.extend({
  createView: function(mission) {
    return new MissionView({
      model: mission
    });
  }
})

var GameView = Backbone.View.extend({
  initialize: function() {
    this._rosterView = new RosterView({
      collection: this.model.game.players
    });
    this._missionListView = new MissionListView({
      collection: this.model.game.missions
    });
  },

  render: function() {
    this.$el.append(this._rosterView.render().el);
    this.$el.append(this._missionListView.render().el);
  }
});

$(document).ready(function() {
  var app = new GameView({
    model: clientstate,
    el: $('body')
  });
  app.render();
});
