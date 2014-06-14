var mongoose = require('mongoose');
var User = mongoose.model('User');
var Directory = mongoose.model('Directory');
var Grid = require("gridfs-stream");
var grid = Grid(User.db.db, mongoose.mongo);



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
        }
        Type.findOne({_id: req.params[typeName]}).exec(function(err, type){
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
                type.users.forEach(function (user){
                    if (req.loggedUser.id == user.id && user.rights==rights){
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