var Backbone = require('backbone');
var _ = require('underscore')._;

/**
 * Extend Backbone.Model to be able to parse collections separately from normal
 * model attributes.
 */
Backbone.Model.prototype.parseCollection = function(data, collection_name) {
  var raw_values = data[collection_name];
  var target = this[collection_name];

  if (raw_values) {

    // map each new model data by id
    var model_data_by_id = {};
    var data_has_id = true;
    _.each(raw_values, function(modelData) {
      if (modelData.id === undefined) {
        data_has_id = false;
      }
      model_data_by_id[modelData.id] = modelData;
    });

    // only try to be smart about updating individual models if we know
    // the data has ids.  Otherwise it's a lot harder to tell which model the
    // data belongs to.
    if (data_has_id) {

      // prune removed models
      target.reject(function(model) {
        return !model_data_by_id[model.id];
      });

      // update/add models
      _.each(raw_values, function(modelData) {
        var model = null;
        if (model = target.get(modelData.id)) {
          model.set(model.parse(modelData), { parse: true });
        } else {
          target.add(modelData, { parse: true });
        }
      });
    } else {
      target.reset(raw_values, { parse: true });
    }
  }
};

_.extend(exports, Backbone);
