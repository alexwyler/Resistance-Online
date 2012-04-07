var Backbone = require('backbone');

var CollectionView = exports.CollectionView = Backbone.View.extend({
  initialize: function() {
    _(this).bindAll('addItem', 'removeItem', 'resetItems');
    this._views = [];
    this._currentSize = 0;

    this.resetItems();

    this.collection.on('add', this.addItem);
    this.collection.on('remove', this.removeItem);
    this.collection.on('reset', this.resetItems);
  },

  addItem: function(item) {
    var view = this.createView(item);
    view.render();
    if (this._currentSize < this.options.minimumSize) {
      this._views.splice(this._currentSize, 0, view);
      view.$el.insertBefore(this._views[this._currentSize + 1].el);
      var placeholder = this._views.pop();
      placeholder.remove();
    } else {
      this._views.push(view);
      this.$el.append(view.el);
    }
    this._currentSize++;
    return this;
  },

  removeItem: function(item) {
    var viewToRemove = _(this._views).select(function (child) {
      return child.model === item;
    })[0];
    this._views = _(this._views).without(viewToRemove);
    viewToRemove.$el.remove();
    this._currentSize--;
    if (this._currentSize < this.options.minimumSize) {
      var placeholder = this.createPlaceholder();
      this._views.push(placeholder);
      placeholder.render();
      this.$el.append(placeholder.el);
    }
  },

  resetItems: function() {
    _(this._views).each(function(view) {
      view.remove();
    });
    this._views = [];
    this._currentSize = 0;

    if (this.options.minimumSize > 0) {
      for (var i = 0; i < this.options.minimumSize; i++) {
        this._views.push(this.createPlaceholder());
      }
    }
    this.render();

    this.collection.each(this.addItem);
  },

  render: function() {
    var me = this;
    _(this._views).each(function(child) {
      child.render();
      me.$el.append(child.el);
    });
    return this;
  },

  createView: function(model) {
    return new Backbone.View({
      model: model
    });
  },

  createPlaceholder: function() {
    return new Backbone.View();
  }
});

