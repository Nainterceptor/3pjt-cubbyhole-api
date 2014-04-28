var mongoose = require('mongoose');
module.exports = function(directorySchema) {
    //Check if name exist
    directorySchema.path('name').validate(
        function (name, fn) {
            /*
            var Directory = mongoose.model('Directory');
            if (this.isNew || this.isModified('name')) {
                Directory.find({ name: name }).exec(function (err, plans) {
                    fn(!err && plans.length === 0);
                })
            } else {
                fn(true);
            }*/
            fn(true);
        },
        'validator.directory.name.alreadyExist'
    );
};
