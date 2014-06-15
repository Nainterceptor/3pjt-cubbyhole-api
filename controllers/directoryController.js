var mongoose = require('mongoose');
var Directory = mongoose.model('Directory');
var User = mongoose.model('User');
var validatorHelper = require('../helpers/validator.js');
var jsonMask = require('json-mask');
var Grid = require("gridfs-stream");

var grid = Grid(Directory.db.db, mongoose.mongo);

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

function removeCascade(directory, userId) {
    directory.getChildren(function (err, children) {
        children.forEach(function(child) {
            removeCascade(child);
        });
    });
    directory.remove();
    var searchOnFiles = {
        "metadata.users._id": userId,
        "metadata.directory": directory.id
    };
    grid.files.find(searchOnFiles).toArray(function (err, files) {
        files.forEach(function(file) {
            grid.remove({'_id': file._id}, function () {});
        });
    });
}

exports.remove = function(req, res) {
    removeCascade(req.directory, req.loggedUser._id);
    res.json({
        success: true,
        message: 'remove.async'
    });
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

function editRightsCascade(directory, userId, users) {
    directory.getChildren(function (err, children) {
        children.forEach(function(child) {
            editRightsCascade(child);
        });
    });
    directory.set('users', users);
    directory.save(function (saveErr, newDirectory) {
    });
    var searchOnFiles = {
//        "metadata.users._id": userId,
        "metadata.directory._id": directory._id
    };
    grid.files.find(searchOnFiles).toArray(function (err, files) {
        users.forEach(function (user, indexUser) {
            users[indexUser] = jsonMask(user, User.gettablesForFileList());
        });
        files.forEach(function(file) {
            file.metadata.users = users;
            grid.files.update({'_id': file._id}, file,{'w':1},function(err, newFile){
            });
        });
    });
}

exports.editRights = function(req, res) {
    var params = jsonMask(req.body, Directory.settablesUser());
    var directory = req.directory;
    var dirUsers = directory.users;
    var emails = [];
    var result;
    params.users.forEach(function (user) {
        emails.push(user.email);
    });
    User.find({email: {$in: emails}}).exec(function (err, users) {
        if (users == null) {
            result = {
                success: false,
                message: 'directory.users.notFound'
            };
            res.json(result);
        } else if (users.length != emails.length) {
            var usersNotFound = [];
            emails.forEach(function (email) {
                var found = users.every(function (user) {
                    return (user.email != email);

                });
                if (found)
                    usersNotFound.push(email);
            });
            result = {
                success: false,
                message: 'directory.users.notFound',
                usersNotFound: usersNotFound
            };
            res.json(result);
        } else {
            users.forEach(function (user) {
                var found = directory.users.every(function (dirUser, index, dirtUsers) {
                    if (user.id == dirUser.id) {
                        params.users.some(function (paramsUser) {
                            if (user.email == paramsUser.email) {
                                if (paramsUser.rights != undefined)
                                    dirtUsers[index].rights = paramsUser.rights;
                                else
                                    dirtUsers.splice(index);
                                return true;
                            }
                            return false;
                        });
                        return false;
                    }
                    return true;
                });
                if (found) {
                    params.users.some(function (paramsUser) {
                        if (user.email == paramsUser.email) {
                            var userToAdd = {};
                            userToAdd._id = user._id;
                            userToAdd.email = paramsUser.email;
                            userToAdd.rights = paramsUser.rights;
                            dirUsers.push(userToAdd);
                            directory.set('users', dirUsers);
                            return true;
                        }
                        return false;
                    });
                }
            });
            if (req.body.cascade){
                editRightsCascade(directory,req.loggedUser._id,dirUsers);
                result = {
                    success: true,
                    message: 'directory.updateCascade.success',
                    user: directory.users
                };
                res.json(result);
            } else {
                directory.save(function (saveErr, newDirectory) {
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
        }
    });
};

exports.getBreadcrumb = function (req, res) {
    var id = req.params.directory;
    Directory.findOne({ _id: id }).exec(function(err, doc) {
        var directory = jsonMask(doc, Directory.gettables());
        var result;
        if (directory == null) {
            result = {
                success: false,
                message: 'directory.notFound'
            };
            res.json(result);
        } else {
            doc.getAncestors(function (err, ancestors) {
                ancestors.forEach(function(row, index, array) {
                    array[index] = jsonMask(row, Directory.gettables());
                });
                result = {
                    success: true,
                    message: 'directory.one',
                    directory: directory,
                    parent: ancestors
                };
                res.json(result);

            });
        }

    });

};