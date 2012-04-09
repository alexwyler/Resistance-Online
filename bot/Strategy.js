var _ = require('underscore');

var STRATS = exports.STRATS = {
  BASIC : "basic"
};

exports.getStrategy = function(name) {
  var strat;
  if (name == STRATS.BASIC) {
    strat = new BasicStrategy();
  } else {
    throw new Error("Unknown strategy " + name);
  }

  return strat;
}

function Strategy() {
  this.setClient = function(client) {
    this.client = client;
  }
}

BasicStrategy.prototype = new Strategy();
BasicStrategy.prototype.constructor = BasicStrategy;

function BasicStrategy() {
  this.selectMissionParty = function() {
    return _.map(this.client.game.players, function(player) {
      return player.id;
    });
  };

  this.voteForMission = function() {
    return 'yes';
  };

  this.actOnMission = function() {
    return 'pass';
  };
}