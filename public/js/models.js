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
    var game_size = clientState.game.players.length;
    var mission_number = mission.get('turn');
    return MISSION_SIZE[game_size][mission_number - 1];
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
    var me = this;
    FB.api('/' + this.get('id'), function(data) {
      me.set('name', data.first_name);
      me.set('full_name', data.first_name + ' ' + data.last_name);
    });
    FB.api('/' + this.get('id') + '/picture', function(data) {
      me.set('profile_pic', data);
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
    leader: null,
    party: null,
    votes: null
  },

  initialize: function() {
    this.people = new PlayerList();
    this.votes = new VoteList();
    this.actions = new MissionActionList();
  },

  getLeader: function() {
    return clientState.game.getPlayer(this.get('leader'));
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

  initialize: function() {
    _(this).bindAll('addItem');
    this.players = new PlayerList(this.get('players'));
    this.unset('players');
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
      return true;
    }
    return false;
  },

  setGame: function(game) {
    this.game.set(game);
    this.game.players.reset(game.players);
//    this.game.known_roles.reset(game.roles);
    this.game.missions.reset(game.missions);
    this.trigger('join_game', this.game);
  },

  getAuthInfo: function() {
    return {
      id: this.my_id,
      accessToken: this.accessToken,
      signedRequest: this.signedRequest
    };
  }
});

