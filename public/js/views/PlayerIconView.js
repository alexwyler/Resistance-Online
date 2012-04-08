var Backbone = require('backbone');
var Mustache = require('mustache');

var PlayerIconView = exports.PlayerIconView = Backbone.View.extend({
  tagName: 'span',
  className: 'person',

  initialize: function() {
    _(this).bindAll('render');
    this.model.on('change', this.render);
  },

  render: function() {
    var template = '<img src="{{profile_pic}}" /> {{name}}';
    this.$el.html(Mustache.render(template, this.model.attributes));
    return this;
  }
});

