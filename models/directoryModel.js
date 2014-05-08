/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var schema = mongoose.Schema;
var tree = require('mongoose-tree');

var directorySchema;
directorySchema = new schema({
    name: { type: String, required: true },
    user: {
        _id: {
            type: ObjectId,
            ref:'User'
        },
        email: String
    }
});

directorySchema.plugin(tree);

directorySchema.statics = {
    searchable: function() {
        return 'name,_id,user,path';
    },
    gettables: function() {
        return 'name,_id,user,path';
    },
    settables: function() {
        return 'name';
    }
};
require('../validators/directoryValidator.js')(directorySchema);
mongoose.model('Directory', directorySchema);