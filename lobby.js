var _ = require('underscore')._;
// player

function Player(id) {
  this.id = id;
  this.state = U_STATE.SEARCHING;
  this.game = null;
  this.disconnected = false;
}

Player.prototype.assertInGame = function() {
  if (!this.game) {
    throw new Error('User must be in a game');
  }
}

Player.prototype.assertNotInActiveGame = function() {
  if (this.game && this.game.finsished) {
    throw new Error('User must not be in an active game');
  }
}

// Game

function Game(game_id, creator) {
  this.id = game_id;
  this.players = {};
  this.started = false;
  this.finished = false;
  this.creator = creator;
  this.winner = null;
}

Game.prototype.addPlayer = function(player) {
  player.game = this;
  this.players[player.id] = player;
}

Game.prototype.removePlayer = function(player) {
  player.game = null;
  delete this.players[player.id];
  if (this.creator.id == player.id && _.size(this.players) > 0) {
    this.creator = _.first(_.toArray(this.players));
  }
}

Game.prototype.isFinished = function() {
  return this.finished;
}

Game.prototype.endGame = function(winner) {
  this.winner = winner;
  this.finished = true;
}

// validation

Game.prototype.assertPlayerInGame = function(player) {
  if (!player || !player.game || !player.game.id == this.id) {
    throw new Error('Player must be in game');
  }
}

Game.prototype.assertNotStarted = function() {
  if (this.state != G_STATE.FINDING_PLAYERS) {
    throw new Error('Game must have not yet started');
  }
}

Game.prototype.assertPlayerIsCreator = function(creator) {
  this.assertPlayerInGame(creator);
  if (this.creator.id != creator.id) {
    throw new Error('Player must be creator');
  }
}

var U_STATE = {
  SEARCHING : 'searching',
  NOT_READY : 'not_ready',
  READY : 'ready',
  PLAYING : 'playing',
};

var G_STATE = {
  FINDING_PLAYERS : 'finding_players',
  NOT_READY : 'not_ready',
  PLAYING : 'playing',
  FINISHED : 'finished'
};

var NEXT_GAME_ID = 1;
function nextGameID() {
  return NEXT_GAME_ID++;
}
var games = {};
var players = {};

module.exports = {
  Game : Game,
  Player : Player,
  games : games,
  players : players,
  nextGameID : nextGameID,
  U_STATE : U_STATE,
  G_STATE : G_STATE
};