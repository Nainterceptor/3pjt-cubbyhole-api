/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var schema = mongoose.Schema;


/**
 * User Schema
 */

var planSchema;
planSchema = new schema({
    name: { type: String, required: true },
    price: { type: Number},
    duration: { type: Number},
    storage: { type: Number},
    bandwidth: { type: Number},
    quota: { type: Number},
    description: {type: String}
});

planSchema.statics = {
    searchable: function() {
        return 'name,_id';
    },
    gettables: function() {
        return 'name,price,duration,storage,bandwidth,quota,description,_id';
    },
    settables: function() {
        return 'name,price,duration,storage,bandwidth,quota,description';
    }
};
require('../validators/planValidator.js')(planSchema);
mongoose.model('Plan', planSchema);