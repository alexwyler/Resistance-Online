var Backbone = require('backbone');

var CollectionView = require('./CollectionView').CollectionView;

var FacepileView = exports.FacepileView = CollectionView.extend({
  className: 'facepile',

  createView: function(player) {
    return new ItemView({ model: player });
  },

  createPlaceholder: function() {
    return new PlaceholderView();
  }
});

var ItemView = exports.ItemView = Backbone.View.extend({
  tagName: 'span',
  className: 'person',

  initialize: function() {
    this.model.on('change', this.render, this);
  },

  render: function() {
    var template = '<img src="{{profile_pic}}" />';
    this.$el.html(Mustache.render(template, this.model.attributes));
    return this;
  }
});

var PlaceholderView = exports.PlaceholderView = Backbone.View.extend({
  tagName: 'span',
  className: 'person placeholder',

  render: function() {
    return this;
  }
});
