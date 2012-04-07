var Backbone = require('backbone');

var Player = exports.Player = Backbone.Model.extend({
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
    if (!FB) {
      return;
    }
    FB.api('/' + this.get('id'), function(data) {
      me.set('name', data.first_name, options);
      me.set('full_name', data.first_name + ' ' + data.last_name, options);
    });
    FB.api('/' + this.get('id') + '/picture?type=square', function(data) {
      me.set('profile_pic', data, options);
    });
  }
});

var PlayerList = exports.PlayerList = Backbone.Collection.extend({
  model: Player
});
