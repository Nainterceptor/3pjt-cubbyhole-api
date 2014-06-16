var mongoose = require('mongoose');
var User = mongoose.model('User');
var Directory = mongoose.model('Directory');
var Grid = require("gridfs-stream");
var grid = Grid(User.db.db, mongoose.mongo);
var ObjectID = mongoose.mongo.BSONPure.ObjectID;

module.exports.isLogged = function(req, res, next) {
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
        else if (!user.hasValidToken())
            res.send(403, {
                success: false,
                message: 'token.tokenExpired'
            });
        else {
            req.loggedUser = user;
            next();

        }
    });
};

module.exports.has = function(rights) {
    return function (req, res, next){
        var Type;
        var typeName;
        if (req.params.directory){
            Type = Directory;
            typeName = 'directory';
        }
        else if (req.params.file){
            Type = grid.files;
            typeName = 'file';
            req.params[typeName] = ObjectID(req.params[typeName]);
        }
        Type.findOne({_id: req.params[typeName]}, function(err, type){
            if (err)
                res.send(403, {
                    success: false,
                    message: typeName + '.searchError',
                    error: err
                });
            else if (!type)
                res.send(403, {
                    success: false,
                    message: typeName+'.'+typeName+'NotFound'
                });
            else {
                var found = false;
                var usersArray;
                if ('undefined' != typeof req.params.file){
                    usersArray = type.metadata.users;
                } else {
                    usersArray = type.users;
                }
                usersArray.forEach(function (user) {
                    if ((('undefined' != typeof user.id && req.loggedUser.id == user.id) || req.loggedUser.id == user._id.toString() )&& user.rights.search(rights) > -1){
                        found = true;
                        req[typeName] = type;
                        next();
                    }
                });
                if (!found)
                    res.send('403', {
                        success: false,
                        message: typeName+'.permissionDenied'
                    });
            }
        });
    }
};

module.exports.isAdmin = function(req, res, next) {
    if (req.loggedUser.isAdmin()) {
        next();
    } else {
        res.send(403, {
            success: false,
            message: 'token.adminRequired'
        });
    }
};
module.exports.doubleCheck = function(req, res, next) {
    if (req.loggedUser.email == req.headers.dc_email && req.loggedUser.authenticate(req.headers.dc_password)) {
        next();
    } else {
        res.send(403, {
            success: false,
            message: 'token.doubleCheckFailed'
        });
    }
};

module.exports.transparentLoggedUser = function(req, res, next) {
    var token = null;
    if (req.query.token != null)
        token = req.query.token;
    else if (req.headers.token != null)
        token = req.headers.token;
    else if (req.body.token != null)
        token = req.body.token;
    else
        next();
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
        else if (!user.hasValidToken())
            res.send(403, {
                success: false,
                message: 'token.tokenExpired'
            });
        else {
            req.loggedUser = user;
            req.token = token;
            next();

        }
    });
};

module.exports.isPublicOrIsLogged = function(req, res, next) {
    var token = null;
    if (req.query.token != null)
        token = req.query.token;
    else if (req.headers.token != null)
        token = req.headers.token;
    else if (req.body.token != null)
        token = req.body.token;
    else {
        var id = req.params.file;
        grid.files.findOne({ "_id" : ObjectID(id)}, function (err, file) {
            if (err) {
                res.json({
                    success: false,
                    message: 'file.download.errorMetadata',
                    errors: err
                });
            }
            if (!file) {
                res.json({
                    success: false,
                    message: 'file.download.notFound'
                });
            }
            if (file.metadata.public)
                next();
            else {
                res.send(403, {
                    success: false,
                    message: 'file.download.notPublic'
                });
            }
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
        else if (!user.hasValidToken())
            res.send(403, {
                success: false,
                message: 'token.tokenExpired'
            });
        else {
            req.loggedUser = user;
            req.token = token;
            next();

        }
    });
};