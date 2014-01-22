var mongoose = require('mongoose');
module.exports = function(userSchema) {
    //Check email Regex
    userSchema.path('email').validate(
        function (email, fn) {
            var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
            fn(emailRegex.test(email));
        },
        'validator.email.notValid'
    );
    //Check if email exist
    userSchema.path('email').validate(
        function (email, fn) {
            var User = mongoose.model('User')
            if (this.isNew || this.isModified('email')) {
                User.find({ email: email }).exec(function (err, users) {
                    fn(!err && users.length === 0);
                })
            } else {
                fn(true);
            }
        },
        'validator.email.alreadyExist'
    );
};
