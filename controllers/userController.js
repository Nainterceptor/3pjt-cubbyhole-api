var mongoose = require('mongoose');
var User = mongoose.model('User');
var Plan = mongoose.model('Plan');
var validatorHelper = require('../helpers/validator');
var jsonMask = require('json-mask');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/config')[env];
var crypto = require('crypto');
var uniq = require('../helpers/uniq');

/*
 * PUT user
 */

exports.create = function(req, res) {
    var user = User(jsonMask(req.body, User.settables()));
    user.save(function(err, user) {
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
            message: 'user.login.credentialsAreEmpty'
        });
    } else {
        User.findOne(jsonMask(credentials, User.searchable())).exec(function(err, user) {
            if (!user) {
                res.json({
                    success: false,
                    message: 'user.login.userNotFound'
                });
            } else if (user.authenticate(credentials.password)) {
                var now = new Date();
                var userClean = jsonMask(user, User.gettables());
                if (user.tokenExpire != null && user.tokenExpire > now) {
                    res.json({
                        success: true,
                        message: 'user.login.success',
                        user: userClean,
                        token: user.token,
                        expireOn: user.tokenExpire
                    });
                } else {
                    var token = crypto
                        .createHmac('sha1', uniq.uid(10))
                        .update(user.hashed_password + user.email)
                        .digest('hex');
                    var tokenExpire = new Date(now.getTime() + (1000 * config.tokenExpire));
                    user.update({
                        token: token,
                        tokenExpire: tokenExpire
                    }).exec(function(err, saved) {
                        if (saved == null) {
                            result = {
                                success: false,
                                message: 'user.login.userNotFoundDuringRequest'
                            }
                        } else {
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
                }
            } else {
                res.json({
                    success: false,
                    message: 'user.login.passwordIsWrong'
                });
            }
        });
    }
};

exports.renew = function (req, res) {
    var token = null;
    if (req.query.token != null)
        token = req.query.token;
    else if (req.headers.token != null)
        token = req.headers.token;
    else if (req.body.token != null)
        token = req.body.token;
    else {
        res.send(403, {
            success: false,
            message: 'token.notFound'
        });
    }
    User.findOne({ token: token }).exec(function(err, user) {
        if (err)
            res.send(403, {
                success: false,
                message: 'token.searchError',
                error: err
            });
        else if (!user)
            res.send(403, {
                success: false,
                message: 'token.tokenNotFound'
            });
        else {
            var now = new Date();
            var token = crypto
                .createHmac('sha1', uniq.uid(10))
                .update(user.hashed_password + user.email)
                .digest('hex');
            var tokenExpire = new Date(now.getTime() + (1000 * config.tokenExpire));
            user.update({
                token: token,
                tokenExpire: tokenExpire
            }).exec(function(err, saved) {
                if (saved == null) {
                    result = {
                        success: false,
                        message: 'user.login.userNotFoundDuringRequest'
                    }
                } else {
                    result = {
                        success: true,
                        message: 'token.tokenChanged',
                        token: token,
                        expireOn: tokenExpire

                    }
                }
                res.json(result);
            });
        }
    });
};

exports.updateMy = function (req, res) {
    var userDatas = jsonMask(req.body, User.settables());
    User.findOne(req.loggedUser._id, function (err, user) {
        Object.keys(userDatas).forEach(function(key) {
           var val = userDatas[key];
            user.set(key, val);
        });
        user.save(function(saveErr, newUser) {
            var result;
            if (saveErr) {
                validatorHelper.error(saveErr);
                result = {
                    success: false,
                    errors: saveErr.errors,
                    message: 'validator.error'
                };
            } else {
                result = {
                    success: true,
                    message: 'user.update.success',
                    user: jsonMask(newUser, User.gettables())
                };
            }
            res.json(result)
        });
    });
};

exports.update = function (req, res) {
    var id = req.params.id;
    var userDatas = jsonMask(req.body, User.settablesByAdmin());
    User.findOne(id, function (err, user) {
        Object.keys(userDatas).forEach(function(key) {
            var val = userDatas[key];
            user.set(key, val);
        });
        user.save(function(saveErr, newUser) {
            var result;
            if (saveErr) {
                validatorHelper.error(saveErr);
                result = {
                    success: false,
                    errors: saveErr.errors,
                    message: 'validator.error'
                };
            } else {
                result = {
                    success: true,
                    message: 'user.update.success',
                    user: jsonMask(newUser, User.gettables())
                };
            }
            res.json(result)
        });
    });
};

exports.getAll = function (req, res) {
    var skip = 0;
    var limit = 30;
    if (req.query.skip != null)
        skip = parseInt(req.query.skip);
    if (req.query.limit != null)
        limit = parseInt(req.query.limit);
    var searchOn = jsonMask(req.query, User.searchable());
    User.find(searchOn)
        .skip(skip)
        .limit(limit)
        .exec(function (err, users){
        var usersFiltered = jsonMask(users, User.gettables());
        var result;
        if (usersFiltered == null){
            result = {
                success: false,
                message: 'users.notFound'
            };
        } else {
            result = {
                success: true,
                message: 'users.many',
                users: usersFiltered
            };
        }
        res.json(result);
    });

};

exports.subscribeToPlan = function (req, res) {
    Plan.findOne(req.body.plan, function(err, plan) {
        if (err) {
            res.json({
                success: false,
                errors: err,
                message: 'plan.read.error'
            });
        }
        var user  = req.loggedUser;
        user.plan = plan;
        user.save(function(saveErr, newUser) {
            var result;
            if (saveErr) {
                validatorHelper.error(saveErr);
                result = {
                    success: false,
                    errors: saveErr.errors,
                    message: 'validator.error'
                };
            } else {
                result = {
                    success: true,
                    message: 'user.subscribe.success',
                    user: jsonMask(newUser, User.gettables())
                };
            }
            res.json(result)
        });
    });
};