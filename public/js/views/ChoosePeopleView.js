var Backbone = require('backbone');

var CollectionView = require('./CollectionView').CollectionView;
var PlayerIconView = require('./PlayerIconView').PlayerIconView;

var PlayerRowView = exports.PlayerRowView = PlayerIconView.extend({
  tagName: 'li',
  className: 'person-tile',

  events: {
    'click': 'toggleSelection'
  },

  initialize: function(options) {
    this.selection = options.selection;
    this.selection.on('change add remove', this.refresh, this);
    PlayerIconView.prototype.initialize.apply(this, arguments);
  },

  remove: function() {
    this.selection.off(null, null, this);
    PlayerIconView.prototype.remove.call(this);
  },

  refresh: function() {
    if (this.selection.get(this.model.id)) {
      this.$el.addClass('selected')
    } else {
      this.$el.removeClass('selected')
    }
  },

  toggleSelection: function() {
    if (this.selection.get(this.model.id)) {
      this.selection.remove(this.model);
    } else {
      this.selection.add(this.model);
    }
  }

});

var ChoosePeopleView = exports.ChoosePeopleView = CollectionView.extend({
  tagName: 'ul',
  className: 'choose-people',

  createView: function(player) {
    return new PlayerRowView({
      model: player,
      selection: this.options.selection
    });
  }

});
