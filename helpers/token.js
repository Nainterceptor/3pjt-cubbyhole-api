var mongoose = require('mongoose');
var User = mongoose.model('User');
var Directory = mongoose.model('Directory');


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

module.exports.isOwner = function (req, res, next){
  Directory.findOne({_id: req.params.directory}).exec(function(err, directory){
      if (err)
          res.send(403, {
              success: false,
              message: 'directory.searchError',
              error: err
          });
      else if (!directory)
          res.send(403, {
              success: false,
              message: 'directory.directoryNotFound'
          });
      else {
          var ownerFound = false;
          directory.users.forEach(function (user){
              if (req.loggedUser.id == user.id && user.rights=='RW+'){
                  ownerFound = true;
                  req.directory = directory;
                  next();
              }
          });
          if (!ownerFound)
              res.send('403', {
                  success: false,
                  message: 'directory.userNotOwner'
              });
      }
  });
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