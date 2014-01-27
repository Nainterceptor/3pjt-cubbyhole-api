var User = require('mongoose').model('User');
var validatorHelper = require('../helpers/validator.js');
var jsonMask = require('json-mask');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/config')[env];
var crypto = require('crypto');
var uniq = require('../helpers/uniq');

/*
 * PUT user
 */

exports.create = function(req, res) {
    var user = new User(jsonMask(req.body, User.settables));
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

exports.getOne = function(req, res) {
    var searchOn = jsonMask(req.query, User.searchable());
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

exports.getMy = function(req, res) {
    res.json({
        success: true,
        message: 'user.my',
        user: jsonMask(req.loggedUser, User.gettables())
    });
};

exports.remove = function(req, res) {
    var searchOn = jsonMask(req.body, User.searchable());
    User.findOneAndRemove(searchOn, function(err, doc) {
        var user = jsonMask(doc, User.gettables());
        var result;
        if(doc == null) {
            result = {
                success: false,
                message: 'user.notFound'
            };
        } else {
            result = {
                success: true,
                message: 'user.deleted',
                user: user
            };
        }
        res.json(result);
    });

};

exports.removeMy = function(req, res) {
    User.findOneAndRemove(req.loggedUser._id, function(err, doc) {
        var user = jsonMask(doc, User.gettables());
        var result;
        if(doc == null) {
            result = {
                success: false,
                message: 'user.notFound'
            };
        } else {
            result = {
                success: true,
                message: 'user.deleted',
                user: user
            };
        }
        res.json(result);
    });
};

exports.login = function(req, res) {
    var credentials = jsonMask(req.body, 'email,password');
    if(credentials == null || credentials.email == null || credentials.password == null) {
        res.json({
            success: false,
            message: 'user.login.failed',
            error: 'user.login.credentialsAreEmpty'
        });
    } else {
        User.findOne(jsonMask(credentials, User.searchable)).exec(function(err, user) {
            if (user.authenticate(credentials.password)) {
                var token = crypto
                    .createHmac('sha1', uniq.uid(10))
                    .update(user.hashed_password + user.email)
                    .digest('hex');
                var now = new Date();
                var tokenExpire = new Date(now.getTime() + (1000 * config.tokenExpire));
                user.update({
                    token: token,
                    tokenExpire: tokenExpire
                }).exec(function(err, saved) {
                    if (saved == null) {
                        result = {
                            success: false,
                            message: 'user.notFound'
                        }
                    } else {
                        var userClean = jsonMask(user, User.gettables());
                        result = {
                            success: true,
                            message: 'user.login.success',
                            user: userClean,
                            token: token,
                            expireOn: tokenExpire
                        }
                    }
                    res.json(result);

                });
            } else {
                res.json({
                    success: false,
                    message: 'user.login.failed',
                    error: 'user.login.passwordIsWrong'
                });
            }
        });
    }
}
