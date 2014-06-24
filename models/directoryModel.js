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
    users: [{
        _id: {
            type: ObjectId,
            ref:'User'
        },
        email: String,
        rights: String
    }]
});

directorySchema.plugin(tree);

directorySchema.statics = {
    searchable: function() {
        return 'name,_id,path,users/*,parent';
    },
    gettables: function() {
        return 'name,_id,path,users,parent';
    },
    settables: function() {
        return 'name,parent';
    },
    settablesUser: function() {
        return 'users/*,public';
    }
};
require('../validators/directoryValidator.js')(directorySchema);
mongoose.model('Directory', directorySchema);