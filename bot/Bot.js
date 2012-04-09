var SocketPlayer = require('../SocketPlayer').SocketPlayer;
var MockSocket = require('./MockSocket').MockSocket;
var Strategy = require('./Strategy');
var Resistance = require('../resistance');
var _ = require('underscore');

var BOT_ID = 1;
exports.newBotClient = function(strat_name) {
  var serverSocket = new MockSocket();
  var clientSocket = new MockSocket(serverSocket);
  var player = new SocketPlayer("bot:" + ++BOT_ID, serverSocket);
  if (!strat_name) {
    strat_name = Strategy.STRATS.BASIC;
  }
  var strategy = Strategy.getStrategy(strat_name);
  return new BotClient(clientSocket, player, strategy);
}

var BotClient = function(socket, player, strategy) {

  this.strategy = strategy;
  this.socket = socket;
  this.player = player;

  this.strategy.setClient(this);

  this.setGame = function(game) {
    this.game = game;
  };

  this.myRole = function() {
    return this.game.roles[this.player.id];
  };

  this.getCurrentMission = function() {
    return _.last(this.game.missions);
  };

  this.getMissionSize = function() {
    var mission = this.getCurrentMission();
    return resistance.MISSION_SIZE[_.size(this.game.players)][this.mission.turn - 1];
  };

  this.amILeader = function() {
    return this.getCurrentMission().leader_id == this.player.id;
  }

  this.amIOnMission = function() {
    return _.contains(this.getCurrentMission().party, this.player);
  }

  this.chooseParty = function(game) {
    this.setGame(game);
    if (this.amILeader()) {
      _.each(
        this.strategy.selectMissionParty(),
        function(player_id) {
          socket.emit('choose_player', player_id);
        }
      );
      socket.emit('start_vote');
    }
  };

  this.vote = function(game) {
    this.setGame(game);
    socket.emit('vote', this.strategy.voteForMission());
  };

  this.missionAct = function(game) {
    this.setGame(game);
    if (this.amIOnMission()) {
      socket.emit('mission_act', this.Strategy.actOnMission());
    }
  };

  _(this).bindAll();
  console.log("binding client socket " + socket.id);
  socket.on('start_game', this.chooseParty);
  socket.on('mission_complete', this.chooseParty);
  socket.on('start_vote', this.vote);
  socket.on('vote_complete', this.missionAct);
};