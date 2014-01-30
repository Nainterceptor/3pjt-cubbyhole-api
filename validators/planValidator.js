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
        'validator.plan.name.alreadyExist'
    );

    planSchema.path('price').validate(
        function (price, fn){
            fn(price >= 0);
        },
        'validator.plan.price.notValid'
    );

    planSchema.path('duration').validate(
        function (duration, fn){
            fn(duration >= 0);
        },
        'validator.plan.duration.notValid'
    );

    planSchema.path('storage').validate(
        function (storage, fn){
            fn(storage >= 0);
        },
        'validator.plan.storage.notValid'
    );

    planSchema.path('bandwidth').validate(
        function (bandwidth, fn){
            fn(bandwidth >= 0);
        },
        'validator.plan.bandwidth.notValid'
    );

    planSchema.path('quota').validate(
        function (quota, fn){
            fn(quota >= 0);
        },
        'validator.plan.quota.notValid'
    );
};
