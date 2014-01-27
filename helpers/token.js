var User = require('mongoose').model('User');


module.exports.isLogged = function() {
    return function(req, res, next) {
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
    }
};

module.exports.isAdmin = function () {
    return function(req, res, next) {
        if (req.loggedUser.isAdmin()) {
            next();
        } else {
            res.send(403, {
                success: false,
                message: 'token.adminRequired'
            });
        }
    }
};
module.exports.doubleCheck = function () {
    return function(req, res, next) {
        if (req.loggedUser.email == req.body.email && req.loggedUser.authenticate(req.body.password)) {
            next();
        } else {
            res.send(403, {
                success: false,
                message: 'token.doubleCheckFailed'
            });
        }
    }
};