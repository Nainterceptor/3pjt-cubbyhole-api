var User = require('mongoose').model('User');
/*
 * PUT user
 */

exports.create = function(req, res){
    var user = new User(req.body);
    user.save(function(err) {
        var result;
        if (err) {
            result = {
                success: false,
                errors: err.errors,
                message: 'validator.error'
            };
        } else {
            result = {
                success: true,
                message: 'user.create.success'
            };
        }
        res.json(result);
    });
};