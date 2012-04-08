var Backbone = require('backbone');

exports.LoginView = Backbone.View.extend({
  render: function() {
    this.$el.html(
      '<div id="login_page" class="viewport center">' +
        '<br/>  <br/>  <br/>' +
        '<h1 class="center">The Resistance</h1>' +
        '<br/>  <br/>  <br/>' +
        '<div class="fb-login-button center"></div>' +
      '</div>');
    return this;
  }
});
