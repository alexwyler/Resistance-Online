var Backbone = require('backbone');

/**
 * Extend Backbone.Model to be able to parse collections separately from normal
 * model attributes.
 */
Backbone.Model.prototype.parseCollection = function(data, collection) {
  if (data[collection]) {
    if (this[collection].add) {
      this[collection].add(data[collection], { parse: true });
    }
  }
};

_.extend(exports, Backbone);
