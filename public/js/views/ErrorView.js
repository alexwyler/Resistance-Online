var Backbone = require('backbone');
var Mustache = require('mustache');

exports.ErrorView = Backbone.View.extend({
  render: function() {
    var template = [
      '<div class="error_state center title layer">Error</div>',
      '<div class="title">{{error}}</div>',
      '<input type="button" onclick="window.location.reload()" value="Reload"/>'
    ].join('');
    this.$el.html(Mustache.render(template, this.options));
    return this;
  }
});
