var lobby = require('./lobby');

var SocketPlayer = exports.SocketPlayer = function(id, socket) {
  lobby.Player.call(this, id);
  this.socket = socket;
}

SocketPlayer.prototype = new lobby.Player();
SocketPlayer.prototype.constructor = SocketPlayer;

SocketPlayer.prototype.getData = function() {
  return {
    id : this.id,
    state : this.state,
    disconnected : this.disconnected,
  };
};
