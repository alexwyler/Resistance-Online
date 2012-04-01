var MISSION_SIZE = {
   1 : [1, 1, 1, 1, 1],
   2 : [2, 2, 2, 2, 2],
   5 : [2, 3, 2, 3, 3],
   6 : [2, 3, 4, 3, 4],
   7 : [2, 3, 3, 4, 4],
   8 : [3, 4, 4, 5, 5],
   9 : [3, 4, 4, 5, 5],
  10 : [3, 4, 4, 5, 5]
};

var G_STATE = {
  FINDING_PLAYERS : 'finding_players',
  NOT_READY : 'not_ready',
  CHOOSING_MISSION : 'choosing_mission',
  VOTING : 'voting',
  MISSIONING : 'missioning',
  FINISHED : 'finished'
};

var ROLE = {
  SPY : 'spy',
  RESISTANCE : 'resistance'
};

var U_STATE = {
  SEARCHING : 'searching',
  NOT_READY : 'not_ready',
  READY : 'ready',
  PLAYING : 'playing'
};

var VOTE = {
  YES : 'yes',
  NO : 'no'
}

var ACTION = {
  PASS : 'pass',
  FAIL : 'fail'
}

var GameInfo = {
  getMissionSize: function(mission) {
    var game_size = mission.game.players.length;
    var mission_number = mission.get('turn');
    return MISSION_SIZE[game_size][mission_number - 1];
  }
};

/**
 * Extend Backbone.Model to be able to parse collections separately form normal
 * model attributes.
 */
Backbone.Model.prototype.parseCollection = function(data, collection) {
  if (data[collection]) {
    this[collection].add(data[collection], { parse: true });
    delete data[collection];
  }
};

var Player = Backbone.Model.extend({
  defaults: {
    id: null,
    name: null,
    full_name: null,
    profile_pic: 'http://profile.ak.fbcdn.net/static-ak/rsrc.php/v1/y9/r/IB7NOFmPw2a.gif'
  },

  initialize: function() {
    if (this.get('name') === this.defaults.name) {
      this.fetch();
    }
  },

  fetch: function(options) {
    var me = this;
    FB.api('/' + this.get('id'), function(data) {
      me.set('name', data.first_name, options);
      me.set('full_name', data.first_name + ' ' + data.last_name, options);
    });
    FB.api('/' + this.get('id') + '/picture?type=square', function(data) {
      me.set('profile_pic', data, options);
    });
  }
});

var PlayerList = Backbone.Collection.extend({
  model: Player
});

var Vote = Backbone.Model.extend({
  defaults: {
    user_id: null,
    in_favor: null
  }
});

var VoteList = Backbone.Collection.extend({
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
    attempt: null,
    leader: null
  },

  constructor: function() {
    this.party = new PlayerList();
    this.votes = new VoteList();
    this.actions = new MissionActionList();

    Backbone.Model.apply(this, arguments);
  },

  parse: function(data) {
    this.parseCollection(data, 'party');
    this.parseCollection(data, 'votes');
    this.parseCollection(data, 'actions');
    return data;
  },

  getLeader: function() {
    return this.game.getPlayer(this.get('leader'));
  }
});

var MissionList = Backbone.Collection.extend({
  model: Mission
});

var Game = Backbone.Model.extend({
  defaults: {
    id: null,
    creator: null,
    roles: null,
    passes: null,
    fails: null,
    state: ''
  },

  constructor: function() {
    _(this).bindAll('addItem');

    this.players = new PlayerList();
    this.missions = new MissionList();
    this.known_roles = false; // TODO

    this.players.on('add', this.addItem);
    this.missions.on('add', this.addItem);

    return Backbone.Model.apply(this, arguments);
  },

  parse: function(data) {
    this.parseCollection(data, 'players');
    this.parseCollection(data, 'missions');
    return data;
  },

  startGame: function() {
    socket.emit('start_game');
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
  },

  getCurrentMission: function() {
    return this.missions.at(this.missions.length - 1);
  }
});

var GameList = Backbone.Collection.extend({
  model: Game
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
    this.allGames = new GameList();
    this.game = null;
    this.self = null;
  },

  login: function(info) {
    if (info.status == "connected") {
      this.set('signedRequest', info.authResponse.signedRequest);
      this.set('accessToken', info.authResponse.accessToken);
      this.set('my_id', info.authResponse.userID);
      this.trigger('login');
    }
  },

  createGame: function() {
    socket.emit('new_game');
  },

  joinGame: function(id) {
    socket.emit('join_game', id);
  },

  leaveGame: function() {
    this.game = null;
    socket.emit('leave_game');
  },

  didJoinGame: function(game) {
    this.game = game;

    var me = this;
    this.game.players.on('add', function(player) {
      if (player.get('id') === me.get('my_id')) {
        me.self = player;
      }
    });

    this.trigger('join_game', this.game);
  },

  didLeaveGame: function() {
    this.game.set(this.defaults);
    this.trigger('leave_game');
  },

  getAuthInfo: function() {
    return {
      id: this.get('my_id'),
      accessToken: this.get('accessToken'),
      signedRequest: this.get('signedRequest')
    };
  }
});

