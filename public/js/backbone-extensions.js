var Backbone = require('backbone');
var _ = require('underscore')._;

/**
 * Extend Backbone.Model to be able to parse collections separately from normal
 * model attributes.
 */
Backbone.Model.prototype.parseCollection = function(data, collection_name) {
  if (data[collection_name]) {

    // map each new model data by id
    var model_data_by_id = {};
    var data_has_id = true;
    _.each(
      data[collection_name],
      function(modelData) {
        if (modelData.id === undefined) {
          data_has_id = false;
        }
        model_data_by_id[modelData.id] = modelData;
      }
    );

    // only try to be smart about updating individual models if we know
    // the data has ids.  Otherwise it's a lot harder to tell which model the
    // data belongs to.
    if (data_has_id) {

      // prune removed models
      this[collection_name].reject(
        function(model) {
          return !model_data_by_id[model.id];
        });

      // update/add models
      _.each(
        data[collection_name],
        function(modelData) {
          var model = null;
          if (model = this[collection_name].get(modelData.id)) {
            model.set(modelData, { parse : true});
          } else {
            this[collection_name].add(modelData, { parse : true});
          }
        }.bind(this));
    } else {
      this[collection_name].reset();
      this[collection_name].add(data[collection_name], { parse : true});
    }
  }
};

_.extend(exports, Backbone);
