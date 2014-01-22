var User = require('mongoose').model('User');
var validatorHelper = require('../helpers/validator.js');
var jsonMask = require('json-mask');
/*
 * PUT user
 */

exports.create = function(req, res, next) {
    var user = new User(req.body);
    user.save(function(err) {
        if (err)
        var result;
        if (err) {
            validatorHelper.error(err);
            result = {
                success: false,
                errors: err.errors,
                message: 'validator.error'
            };
        } else {
            result = {
                success: true,
                message: 'user.create.success',
                user: jsonMask(user, User.gettables())
            };
        }
        res.json(result);
    });
};

exports.getOne = function(req, res, next) {
    console.log(req.query);
    var searchOn = jsonMask(req.query, User.searchable());
    console.log(searchOn);
    User.findOne(searchOn).exec(function(err, doc) {
        var user = jsonMask(doc, User.gettables());
        var result;
        if (user == null) {
            result = {
                success: false,
                message: 'user.notFound'
            }
        } else {
            result = {
                success: true,
                message: 'user.one',
                user: user
            }
        }
        res.json(result);
    });

};

