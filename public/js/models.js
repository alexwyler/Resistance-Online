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

