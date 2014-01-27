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
    created: {
        type: Date,
        default: Date.now
    },
    email: {
        type: String,
        required: true,
        index: { unique: true }
    },
    hashed_password: { type: String, required: true },
    salt: { type: String },
    token: { type: String },
    tokenExpire: { type: Date },
    admin: { type: Boolean }
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
    },

    /**
     * Check if token is not expired
     * @return {Boolean}
     * @api public
     */
    hasValidToken: function() {
        return (new Date() <= this.tokenExpire);
    },
    /**
     * Check if user is admin
     */
    isAdmin: function() {
        return this.admin == true;
    }
};
userSchema.statics = {
    searchable: function() {
        return 'email,_id,admin';
    },
    gettables: function() {
        return 'email,_id,admin';
    },
    settables: function() {
        return 'email,password'
    },
    settablesByAdmin: function() {
        return 'email,password,admin'
    }
};
require('../validators/userValidator.js')(userSchema);
mongoose.model('User', userSchema);