var fs = require("fs");
var Grid = require("gridfs-stream");
var mongoose = require("mongoose");
var User = require('../models/userModel');
var jsonMask = require('json-mask');
var formidable = require('formidable');
var ObjectID = mongoose.mongo.BSONPure.ObjectID;

var grid = Grid(db.db, mongoose.mongo);

exports.upload = function (req, res) {
    var form = new formidable.IncomingForm();
    var files = {};
    var fields = {};
    form.uploadDir = __dirname + "/../tmp";
    form
        .on('field', function(field, value) {
            fields[field] = value;
        })
        .on('file', function(field, file) {
            console.log(file.name);
            files[field] =  file;
        })
        .on('end', function() {
            console.log('done');
            if (!Object.keys(files).length) {
                res.json({
                    success: false,
                    message: 'file.upload.noFile'
                });
            }
            Object.keys(files).forEach(function(key) {
                var file = files[key];
                var user = jsonMask(req.loggedUser, User.gettables());
                user.rights = 'RW+';
                var writestream = grid.createWriteStream({
                    filename: file.name,
                    metadata: {
                        users: [user]
                    }
                });
                writestream.on('unpipe', function() {
                    fs.unlink(file.path);
                });
                fs.createReadStream(file.path)
                    .on('end', function() {
                        res.json({
                            success: true,
                            message: 'file.upload.success'
                        });
                    })
                    .on('error', function(err) {
                        res.json({
                            success: false,
                            message: 'file.upload.errorDuringUpload',
                            errors: err
                        });
                    })
                    .pipe(writestream);
            });
        })
        .parse(req);



};

exports.download = function (req, res) {
    var id = req.params.id;
    grid.files.findOne({ "_id" : ObjectID(id)}, function (err, file) {
        if (err) {
            res.json({
                success: false,
                message: 'file.download.errorMetadata',
                errors: err
            });
        }
        if (!file) {
            res.json({
                success: false,
                message: 'file.download.notFound'
            });
        }
        console.log(file);
        var weight = 0;
        grid.createReadStream({_id: file._id})
            .on('data', function(chunck) {
                weight += chunck.length;
            })
            .on('end', function() {
                console.log(weight);
            })
            .pipe(res);
    });

};