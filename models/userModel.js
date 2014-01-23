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
    hashed_password: { type: String, required: true },
    salt: { type: String }
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
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */

    encryptPassword: function (password) {
        if (!password)
            return '';
        var encrypted;
        try {
            encrypted = crypto.createHmac('sha1', this.salt).update(password).digest('hex');
            return encrypted;
        } catch (err) {
            return '';
        }
    },
    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */

    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + ''
    }
};
userSchema.statics = {
    searchable: function() {
        return 'email,_id';
    },
    gettables: function() {
        return 'email,_id';
    }
};
require('../validators/userValidator.js')(userSchema);
mongoose.model('User', userSchema);