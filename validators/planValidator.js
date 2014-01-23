var mongoose = require('mongoose');
module.exports = function(planSchema) {
    //Check if name exist
    planSchema.path('name').validate(
        function (name, fn) {
            var Plan = mongoose.model('Plan')
            if (this.isNew || this.isModified('name')) {
                Plan.find({ name: name }).exec(function (err, plans) {
                    fn(!err && plans.length === 0);
                })
            } else {
                fn(true);
            }
        },
        'validator.name.alreadyExist'
    );
};
