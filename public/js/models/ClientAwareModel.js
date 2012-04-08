var _ = require('underscore')._;
var Backbone = require('backbone');

var ClientAwareModel = exports.ClientAwareModel = Backbone.Model.extend({

  setClientState : function(clientState) {
    this.clientState = clientState;
    return this;
  },

  getClientState : function() {
    return this.clientState;
  },

  // utility methods delegated to clientState

  isSelf : function(player_id) {
    return player_id == this.getSelf();
  },

  getSelf : function() {
    return this.clientState.get('my_id');
  },

});
