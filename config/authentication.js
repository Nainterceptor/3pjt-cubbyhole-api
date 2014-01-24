var BearerStrategy = require('passport-http-bearer').Strategy;
var User = require('mongoose').model('User');

module.exports = function(passport) {
    passport.use(new BearerStrategy({},
        function(token, done) {
            process.nextTick(function () {
                User.findOne({ token: token }).exec(function(err, user) {
                    if (err)
                        return done(err);
                    if (!user)
                        return done(null, false);
                    if (!user.hasValidToken())
                        return done(null, false);
                    return done(null, user);
                })
            });
        }
    ));
};