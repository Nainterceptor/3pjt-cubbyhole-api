var mongoose = require('mongoose');
var Directory = mongoose.model('Directory');
var User = mongoose.model('User');
var validatorHelper = require('../helpers/validator.js');
var jsonMask = require('json-mask');


exports.create = function(req, res) {
    var directory = new Directory(jsonMask(req.body, Directory.settables()));
    var user = jsonMask(req.loggedUser, "_id,email");
    user.rights = 'RW+';
    directory.users.push(user);
    if (typeof req.body.parent != 'undefined') {
        directory.parent = req.body.parent;
    }

    directory.save(function(err) {
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
                message: 'directory.create.success',
                directory: jsonMask(directory, Directory.gettables())
            };
        }
        res.json(result);
    });
};

/*exports.getOne = function(req, res) {
 var searchOn = jsonMask(req.query, Directory.searchable());
 //    if (searchOn == null)
 //        searchOn = {};
 //    searchOn.user = jsonMask(req.loggedUser, "_id,email");
 Directory.findOne(searchOn).exec(function(err, doc) {
 var directory = jsonMask(doc, Directory.gettables());
 var result;
 if (directory == null) {
 result = {
 success: false,
 message: 'directory.notFound'
 };
 res.json(result);
 } else {
 doc.getChildren(function (err, children) {
 doc.getAncestors(function (err, ancestors) {
 children.forEach(function(row, index, array) {
 array[index] = jsonMask(row, Directory.gettables());
 });
 ancestors.forEach(function(row, index, array) {
 array[index] = jsonMask(row, Directory.gettables());
 });
 result = {
 success: true,
 message: 'directory.one',
 directory: directory,
 children: children,
 parent: ancestors
 };
 res.json(result);
 });
 });
 }
 });

 };*/

exports.remove = function(req, res) {
};

exports.update = function (req, res){
    var params = jsonMask(req.body, Directory.settables());
    var directory = req.directory;
    Object.keys(params).forEach(function(key) {
        var val = params[key];
        directory.set(key, val);
    });
    directory.save(function (saveErr, newDirectory){
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
                message: 'directory.update.success',
                user: jsonMask(newDirectory, Directory.gettables())
            };
        }
        res.json(result)
    });
};

exports.addUsers = function(req, res){
    var params = jsonMask(req.body, Directory.settablesUser());
    var directory = req.directory;
    var dirUsers = directory.users;
    var emails = [];
    var result;
    params.users.forEach(function (user){
        if (!user.rights)
            res.json(result = {
                success: false,
                message: 'directory.users.rights.notFound'
            });
        emails.push(user.email);
    });
    User.find({email: {$in: emails}}).exec(function (err, users){
        if (users == null) {
            result = {
                success: false,
                message: 'directory.users.notFound'
            };
            res.json(result);
        } else if (users.length != emails.length){
            var usersNotFound = [];
            emails.forEach(function(email){
                var found = false;
                users.forEach(function(user){
                    if (user.email == email)
                        found = true;
                });
                if (!found)
                    usersNotFound.push(email);
            });
            result = {
                success: false,
                message: 'directory.users.notFound',
                usersNotFound: usersNotFound
            };
            res.json(result);
        } else {
            users.forEach(function (user){
                var found = false;
                directory.users.forEach(function (dirUser){
                    if (user.id == dirUser.id)
                        found = true;
                });
                if (!found){
                    params.users.forEach(function (paramUser){
                        if (user.email == paramUser.email){
                            var userToAdd = {};
                            userToAdd._id = user._id;
                            userToAdd.email = paramUser.email;
                            userToAdd.rights = paramUser.rights;
                            dirUsers.push(userToAdd);
                            directory.set('users', dirUsers);
                        }
                    });
                }
            });
            directory.save(function (saveErr, newDirectory){
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
                        message: 'directory.update.success',
                        user: jsonMask(newDirectory, Directory.gettables())
                    };
                }
                res.json(result);
            });
        }
    });
};

exports.updateUser = function(req, res){

};

exports.removeUser = function(req, res){

};