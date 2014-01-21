/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var crypto = require('crypto');
var schema = mongoose.Schema;


/**
 * User Schema
 */

var userSchema;
userSchema = new schema({
    email: { type: String, required: true },
    hashed_password: { type: String },
    salt: { type: String },
    authToken: { type: String }
});

/**
 * Virtuals
 */
userSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password });

/**
 * Validators
 */
userSchema.path('email').validate(function (email, fn) {
    var User = mongoose.model('User')
        // Check only when it is a new user or when email field is modified
        if (this.isNew || this.isModified('email')) {
            User.find({ email: email }).exec(function (err, users) {
                fn(!err && users.length === 0)
            })
        } else fn(true);
}, 'validator.email.alreadyExist');

userSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */

    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password
    }
}
mongoose.model('User', userSchema);