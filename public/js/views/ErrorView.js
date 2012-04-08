var Backbone = require('backbone');

exports.ErrorView = Backbone.View.extend({
  render: function() {
    var template = [
      '<div id="error_view" class="viewport center">',
        '<div class="error_state center title layer">Error</div>',
        '<div class="title">{{error}}</div>',
        '<input type="button" onclick="window.location.reload()" value="Reload"/>',
      '</div>'
    ].join('');
    this.$el.html(Mustache.render(template, this.options));
    return this;
  }
});