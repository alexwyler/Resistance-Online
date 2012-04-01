var CollectionView = Backbone.View.extend({
  initialize: function() {
    _(this).bindAll('addItem', 'removeItem', 'resetItems');
    this._views = [];

    if (this.options.minimumSize > 0) {
      for (var i = 0; i < this.options.minimumSize; i++) {
        this._views.push(this.createPlaceholder());
      }
    }

    this.collection.each(this.addItem);
    this.collection.on('add', this.addItem);
    this.collection.on('remove', this.removeItem);
    this.collection.on('reset', this.resetItems);
  },

  addItem: function(item) {
    var view = this.createView(item);
    view.render();
    if (this.collection.length <= this.options.minimumSize) {
      this._views.splice(this.collection.length - 1, 0, view);
      this.el.insertBefore(view.el, this._views[this.collection.length].el);
      var placeholder = this._views.pop();
      placeholder.remove();
    } else {
      this._views.push(view);
      this.$el.append(view.el);
    }
    return this;
  },

  removeItem: function(item) {
    var viewToRemove = _(this._views).select(function (child) {
      return child.model === item;
    })[0];
    this._views = _(this._views).without(viewToRemove);
    viewToRemove.$el.remove();
    if (this.collection.length < this.options.minimumSize) {
      var placeholder = this.createPlaceholder();
      this._views.push(placeholder);
      placeholder.render();
      this.$el.append(placeholder);
    }
  },

  resetItems: function() {
    _(this._views).each(function(view) {
      view.remove();
    });
   this._views = [];
   this.collection.each(this.addItem);
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
  },

  createPlaceholder: function() {
    return new Backbone.View();
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
  },

  createPlaceholder: function() {
    return new PlayerIconView({
      model: new Player(),
      tagName: 'li'
    });
  }
});

var MissionView = Backbone.View.extend({
  initialize: function() {
    this._leaderView = new PlayerIconView({
      model: this.model.getLeader()
    });
    this._peopleView = new RosterView({
      collection: this.model.people,
      minimumSize: GameInfo.getMissionSize(this.model)
    });
  },

  render: function() {
    this.$el.append('Leader:');
    this.$el.append(this._leaderView.render().el);
    this.$el.append('Attempt:' + this.model.get('attempt'));
    this.$el.append('People:');
    this.$el.append(this._peopleView.render().el);
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
    this.$el.append('<button onclick="mock_next(); return false;">Next step</button>');
  }
});
