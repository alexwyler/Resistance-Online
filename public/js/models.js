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
  FINISHED : 'finished'
};

var M_STATE = {
  CHOOSING_MISSION : 'choosing_mission',
  VOTING : 'voting',
  MISSIONING : 'missioning',
  FINISHED : 'finished'
};

var MISSION_STATES = {
  FUTURE: 'future',
  WAITING_FOR_PEOPLE: 'waiting-for-people',
  CHOOSING_PEOPLE: 'choosing-people',
  VOTING: 'voting',
  ON_MISSION: 'on-mission',
  WAITING_FOR_RESULTS: 'waiting-for-results',
  SKIPPED: 'skipped',
  PASSED: 'passed',
  FAILED: 'failed'
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
 * Extend Backbone.Model to be able to parse collections separately from normal
 * model attributes.
 */
Backbone.Model.prototype.parseCollection = function(data, collection) {
  if (data[collection]) {
    if (this[collection].add) {
      this[collection].add(data[collection], { parse: true });
    }
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
    leader_id: null,
    state : null
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

  compareTo: function(other) {
    if (this.get('turn') != other.get('turn')) {
      return other.get('turn') - this.get('turn');
    }
    return other.get('attempt') - this.get('attempt');
  },

  getLeader: function() {
    return this.game.getPlayer(this.get('leader_id'));
  },

  addToParty: function(player) {
    socket.emit('choose_player', player.id);
  },

  removeFromParty: function(player) {
    socket.emit('unchoose_player', player.id);
  },

  startVote: function() {
    socket.emit('start_vote');
  },

  isPassing: function() {
    // XXX(rpatterson): handle the special 4th mission
    return this.actions.all(function(action) {
      action.get('mission_action') == ACTION.PASS;
    });
  },

  isClientLeader: function() {
    return this.get('leader_id') == this.game.self.id;
  },

  /**
   * Calculate the state that this mission view is currently in, based on the
   * local player and the game's state.
   */
  getState: function() {
    var game_state = this.game.get('state');
    var local_player = this.game.self;
    var relation_to_current_mission =
      this.compareTo(this.game.getCurrentMission());

    // Is this a future mission?
    if (relation_to_current_mission != 0 &&
        this.votes.length == 0) {
      return MISSION_STATES.FUTURE;

    // Is this a previous, skipped mission?
    } else if (relation_to_current_mission != 0 &&
               this.actions.length == 0) {
      return MISSION_STATES.SKIPPED;

    // Is this a previous, passed mission?
    } else if (relation_to_current_mission != 0 &&
               this.isPassing()) {
      return MISSION_STATES.PASSED;

    // Is this a previous, failed mission?
    } else if (relation_to_current_mission != 0 &&
               !this.isPassing()) {
      return MISSION_STATES.FAILED;

    // Are we the leader, choosing people?
    } else if (game_state == G_STATE.CHOOSING_MISSION &&
               this.getLeader() == local_player) {
      return MISSION_STATES.CHOOSING_PEOPLE;

    // Are we waiting for the leader to choose people?
    } else if (game_state == G_STATE.CHOOSING_MISSION) {
      return MISSION_STATES.WAITING_FOR_PEOPLE;

    // Are we voting on the proposal?
    } else if (game_state == G_STATE.VOTING) {
        return MISSION_STATES.VOTING;

    // Are we on this mission?
    } else if (game_state == G_STATE.MISSIONING &&
               this.people.get(local_player.id)) {
      return MISSION_STATES.ON_MISSION;

    // We must be waiting for the mission results
    } else {
      return MISSION_STATES.WAITING_FOR_RESULTS;
    }
  },
});

var MissionList = Backbone.Collection.extend({
  model: Mission
});

var Game = Backbone.Model.extend({
  defaults: {
    id: null,
    local_player_id: null,
    creator: null,
    roles: null,
    passes: null,
    fails: null,
    state: ''
  },

  constructor: function() {
    _(this).bindAll();

    this.players = new PlayerList();
    this.missions = new MissionList();
    this.known_roles = false; // TODO

    this.players.on('add', this._addItem);
    this.missions.on('add', this._addItem);

    this.players.on('add', this._checkIfSelf);
    this.players.on('reset', this._findSelf);
    this.on('change:local_player_id', this._findSelf);

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

  leaveGame: function() {
    socket.emit('leave_game');
  },

  getPlayer: function(id) {
    return this.players.find(function(p) {
      return p.id == id;
    });
  },

  getCurrentMission: function() {
    if (this.get('state') == G_STATE.FINISHED) {
      return null;
    } else {
      return this.missions.at(this.missions.length - 1);
    }
  },

  /**
   * Called when players or missions are added to this game.
   */
  _addItem: function(item) {
    item.game = this;
  },

  getCurrentMission: function() {
    return this.missions.last();
  },

  _findSelf: function() {
    this.players.each(this._checkIfSelf);
  },

  _checkIfSelf: function(player) {
    // todo (awyler) rethink this.get('local_player_id')
    if (this.get('local_player_id') == player.get('id')) {
      this.self = player;
    }
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
  },

  login: function(info) {
    if (info.status == "connected") {
      this.set('signedRequest', info.authResponse.signedRequest);
      this.set('accessToken', info.authResponse.accessToken);
      my_id = info.authResponse.userID;
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
    this.trigger('join_game', this.game);
  },

  didLeaveGame: function() {
    this.game = null;
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

