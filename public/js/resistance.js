const PLAYER_DB = [
  {
    name: 'Ryan Patterson',
    fbid: 693594821,
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/273581_693594821_24739666_q.jpg'
  }, {
    name: 'Zizhuang Yang',
    fbid: 1341660327,
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/275664_1341660327_177798061_q.jpg'
  }, {
    name: 'Alex Wyler',
    fbid: 1599450468,
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174184_1599450468_1761600976_q.jpg',
  }, {
    name: 'Mary Pimenova',
    fbid: 571997087,
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-ash2/565181_571997087_2000265899_q.jpg'
  }, {
    name: 'Derek Brandao',
    fbid: 6203644,
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/174156_6203644_1590218817_q.jpg'
  }, {
    name: 'Ben Zax',
    fbid: 1653295587,
    profile_pic: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/41760_1653295587_4599_q.jpg'
  }
];

var Player = Backbone.Model.extend({
  defaults: {
  }
});

var PlayerList = Backbone.Collection.extend({
  model: Player
});

var Game = Backbone.Model.extend({
  defaults: {
    players: []
  },

  initialize: function() {
    this.players = new PlayerList();
  }
});

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
  var game = new Game();
  game.players.add(PLAYER_DB);

  var app = new GameView({
    model: game,
    el: $('body')
  });
});
