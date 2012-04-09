
var MOCK_SOCKET_ID = 1;
var MOCK_SOCKET_NAME_SPACE = 'mock_socket:';

function getNextMockSocketID() {
  return MOCK_SOCKET_NAME_SPACE + ++MOCK_SOCKET_ID;
}

exports.MockSocket = function(partner) {
  this.id = getNextMockSocketID();

  this.on_events = {};

  if (partner) {
    this.partner = partner;
    this.partner.partner = this;
  }

  this.on = function(event, callback) {
    this.on_events[event] = callback;
  }

  this.getType = function() {
    return (this.server == undefined) ? 'client' : 'server';
  }

  this.emit = function(event, data) {
    if (this.partner.on_events[event]) {
      console.log(
        "emit " + this.id + " (" + this.getType()
          + "): " + event + ", " + data);
      this.partner.on_events[event](data);
    } else {
      console.log(
        'event type "' +
          event +
          '" not defined on partner socket ' +
          this.partner.id + ' (' + this.partner.getType() + ')'
      );
    }
  }
}