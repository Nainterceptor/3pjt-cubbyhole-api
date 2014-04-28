var mongoose = require('mongoose');
var Directory = mongoose.model('Directory');
var validatorHelper = require('../helpers/validator.js');
var jsonMask = require('json-mask');


exports.create = function(req, res) {
    var directory = new Directory(jsonMask(req.body, Directory.settables()));
    directory.user = jsonMask(req.loggedUser, "_id,email");
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

exports.getOne = function(req, res) {
    var searchOn = jsonMask(req.query, Directory.searchable());
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

};

exports.remove = function(req, res) {
};

exports.update = function (req, res){

};

