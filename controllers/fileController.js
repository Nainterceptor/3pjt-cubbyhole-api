var fs = require("fs");
var Grid = require("gridfs-stream");
var mongoose = require("mongoose");
var User = mongoose.model('User');
var Plan = mongoose.model('Plan');
var Directory = mongoose.model('Directory');
var jsonMask = require('json-mask');
var formidable = require('formidable');
var ObjectID = mongoose.mongo.BSONPure.ObjectID;
var quotaHelper = require('../helpers/quota');
var Throttle = require('throttle');

var grid = Grid(User.db.db, mongoose.mongo);

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
            if (!Object.keys(files).length) {
                res.json({
                    success: false,
                    message: 'file.upload.noFile'
                });
            }
            Object.keys(files).forEach(function(key) {
                var file = files[key];
                var user = jsonMask(req.loggedUser, User.gettables());
                user.plan = jsonMask(user.plan, Plan.gettables());
                user.rights = 'RW+';
                Directory.findOne({_id: fields.directory}).exec(function(err, directory) {
                    var options = {
                        filename: file.name,
                        metadata: {
                            users: [user]
                        }
                    };
                    if (fields.public){
                        options.metadata.public = true;
                    }
                    if (directory != null) {
                        options.metadata.directory = jsonMask(directory, '_id,name');
                        directory.users.forEach(function(userDir){
                            if (userDir.rights && userDir.id != user._id.toString()){
                                var userToAdd = {};
                                userToAdd._id = userDir._id;
                                userToAdd.email = userDir.email;
                                userToAdd.rights = 'R';
                                options.metadata.users.push(userToAdd);

                            }
                        });
                    }
                    var writestream = grid.createWriteStream(options);
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
            });
        })
        .parse(req);

};

var doDownload = function(req, res, file) {
    var weight = 0;
    var options =  {_id: file._id};
    if (req.headers['range']) {
        var parts = req.headers['range'].replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        options.start = parseInt(partialstart, 10);
        options.end = partialend ? parseInt(partialend, 10) : file.length -1;
        res.writeHead(206, {
            'Content-Range': 'bytes ' + options.start + '-' + options.end + '/' + file.length,
            'Accept-Ranges': 'bytes',
            'Content-Length': options.end - options.start + 1,
            'Content-Type': file.contentType,
            'Content-disposition': 'attachment; filename="' + file.filename + '"'
        });
    } else {
        res.setHeader('Content-type', file.contentType);
        res.setHeader('Content-Length', file.length);
        res.setHeader('Content-disposition', 'attachment; filename="' + file.filename + '"');
    }

    var downloadEnded = function(){
        if (weight == 0)
            weight = file.length;
        res.removeListener('finish', downloadEnded);
        res.removeListener('close', downloadEnded);
        res.end();
    };
    var speed = 25 * 1024;
    if ('undefined' != typeof req.loggedUser && 'undefined' != typeof req.loggedUser.plan && 'undefined' != typeof req.loggedUser.plan.bandwidth){
        speed = req.loggedUser.plan.bandwidth;
    }
    if (speed != 0) {
        var throttle = new Throttle({ bps: speed, chunkSize: file.chunkSize }); //100 Ko/s
        grid.createReadStream(options)
            .on('data', function (chunck) {
                weight += chunck.length;
            })
            .on('end', downloadEnded)
            .pipe(throttle)
            .pipe(res);
        res.on('finish', downloadEnded);
        res.on('close', downloadEnded);
    } else {
        grid.createReadStream(options)
            .on('data', function (chunck) {
                weight += chunck.length;
            })
            .on('end', downloadEnded)
            .pipe(res);
        res.on('finish', downloadEnded);
        res.on('close', downloadEnded);
    }
};

exports.download = function (req, res) {
    var id = req.params.file;
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
        if (req.loggedUser) {
            req.loggedUser.cleanDownloads();
            req.loggedUser.latestDownloads.push({
                _id: file._id,
                weight: file.length
            });
            req.loggedUser.save(function(err, user) {
                doDownload(req, res, file);
            });
        } else {
            file.metadata.latestDownloads = quotaHelper.cleanOldDownloads(file.metadata.latestDownloads);
            file.metadata.latestDownloads.push({
                _id: file._id,
                weight: file.length,
                downloadedAt: new Date()
            });
            grid.files.save(file, {w: 1}, function(err, newFile) {
                doDownload(req, res, file);
            });
        }
    });
};

exports.remove = function (req, res) {
    var id = req.params.file;
    grid.remove({ "_id" : ObjectID(id)}, function (err) {
        res.json({
            success: true,
            message: 'file.removed'
        })
    });
};

exports.list = function (req, res) {
    var directory = req.params.directory;
    var searchOnDirectories = {
        "users._id": req.loggedUser.id
    };
    var searchOnFiles = {
        "metadata.users._id": req.loggedUser._id
    };
    if (null == directory) {
        searchOnDirectories["parent"] = {"$exists" : false};
        searchOnFiles["metadata.directory"] = {"$exists" : false};

    } else {
        searchOnDirectories["parent"] = directory;
        searchOnFiles['metadata.directory._id'] = ObjectID(directory);

    }
    Directory.find(searchOnDirectories).exec(function(err, directories) {
        directories.forEach(function(directory, indexDirectory) {
            directory.users.forEach(function(user, indexUser) {
                directory.users[indexUser] = jsonMask(user, User.gettablesForFileList());
            });
            directories[indexDirectory] = jsonMask(directory, Directory.gettables());
        });
        grid.files.find(searchOnFiles).toArray(function (err, files) {
            files.forEach(function(file, indexFile){
                files[indexFile] = jsonMask(file, '_id,filename,length,contentType,uploadDate,md5,metadata/users');
            });
            res.json({
                success: true,
                message: 'file.list',
                files: files,
                directories: directories
            });
        });
    });
};

exports.editRights = function(req, res) {
    var params = jsonMask(req.body, Directory.settablesUser());
    var file = req.file;
    var filUsers = file.metadata.users;
    var emails = [];
    var result;
    file.metadata.public = false;
    if (null !== params && params.public == 'true') {
        file.metadata.public = true;
    }
    grid.files.update({'_id': file._id}, file,{'w':1},function(saveErr, newFile) {
        if (saveErr) {
            result = {
                success: false,
                errors: saveErr,
                message: 'validator.error'
            };
        } else {
            result = {
                success: true,
                message: 'file.update.success',
                user: jsonMask(newFile, Directory.gettables())
            };
        }
        res.json(result);
    });
    return;
    params.users.forEach(function (user) {
        emails.push(user.email);
    });
    User.find({email: {$in: emails}}).exec(function (err, users) {
        if (users == null) {
            result = {
                success: false,
                message: 'file.users.notFound'
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
                message: 'file.users.notFound',
                usersNotFound: usersNotFound
            };
            res.json(result);
        } else {
            users.forEach(function (user) {
                var found = file.metadata.users.every(function (filUser, index, fileUsers) {
                    if (user.email == filUser.email) {
                        params.users.some(function (paramsUser) {
                            if (user.email == paramsUser.email) {
                                if (paramsUser.rights != undefined)
                                    fileUsers[index].rights = paramsUser.rights;
                                else
                                    fileUsers.splice(index);
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
                            filUsers.push(userToAdd);
                            file.metadata.users.push(userToAdd);
                            return true;
                        }
                        return false;
                    });
                }
            });
            grid.files.update({'_id': file._id}, file,{'w':1},function(saveErr, newFile) {
                if (saveErr) {
                    result = {
                        success: false,
                        errors: saveErr,
                        message: 'validator.error'
                    };
                } else {
                    result = {
                        success: true,
                        message: 'file.update.success',
                        user: jsonMask(newFile, Directory.gettables())
                    };
                }
                res.json(result);
            });
        }
    });
};

exports.getMetadatas = function (req, res) {
    var file = req.file;
    var fileFiltered = jsonMask(file, '_id,filename,length,contentType,uploadDate,md5,metadata/*');
    res.json({
        success: true,
        message: 'file.get',
        file: fileFiltered
    });
};