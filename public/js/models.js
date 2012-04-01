var Player = Backbone.Model.extend({
  defaults: {
    id: null,
    name: null,
    profile_pic: null
  }
});

var PlayerList = Backbone.Collection.extend({
  model: Player
});

var Vote = Backbone.Model.extend({
  defaults: {
    user_id: null,
    vote: null
  }
});

var VoteList = Backbone.Model.extend({
  model: Vote
});

var MissionAction = Backbone.Model.extend({
  defaults: {
    user_id: null,
    mission_action: null
  }
});

var MissionActionList = Backbone.Model.extend({
  model: Mission
});

var Mission = Backbone.Model.extend({
  defaults: {
    turn: null,
    leader_id: null,
  },

  initialize: function() {
    this.people = new PlayerList();
    this.votes = new VoteList();
    this.mission_actions = new MissionAction();
  },

  getLeader: function() {
    return this.game.getPlayer(this.get('leader_id'));
  }
});

var MissionList = Backbone.Collection.extend({
  model: Mission
});

var Game = Backbone.Model.extend({
  defaults: {
  },

  initialize: function() {
    _(this).bindAll('addItem');
    this.players = new PlayerList();
    this.missions = new MissionList();
    this.known_roles = false; // TODO

    var me = this;
    this.players.on('add', this.addItem);
    this.missions.on('add', this.addItem);
  },

  /**
   * Called when players or missions are added to this game.
   */
  addItem: function(item) {
    item.game = this;
  },

  getPlayer: function(id) {
    return this.players.find(function(p) {
      return p.id == id;
    });
  }
});

var ClientState = Backbone.Model.extend({
  defaults: {
    my_id: null,
    loggedin: false,
    accessToken: null,
    signedRequest: null
  },

  initialize: function() {
    _(this).bindAll('login', 'getAuthInfo');
    this.game = new Game();
    this.self = null;

    var me = this;
    this.game.players.on('add', function(player) {
      if (player.get('id') === me.get('my_id')) {
        me.self = player;
      }
    });
  },
                                          
  login: function(info) {
    if (info.status == "connected") {
      this.signedRequest = info.authResponse.signedRequest;
      this.accessToken = info.authResponse.accessToken;
      this.my_id = info.authResponse.userID;
      socket.emit('init', {
          auth: this.getAuthInfo()
        }
      );
    }
  },

  getAuthInfo: function() {
    return {
      id: this.my_id,
      accessToken: this.accessToken,
      signedRequest: this.signedRequest
    };
  }
});

