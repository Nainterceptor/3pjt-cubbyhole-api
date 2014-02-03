var fs = require("fs");
var Grid = require("gridfs-stream");
var mongoose = require("mongoose");
var grid = Grid(db.db, mongoose.mongo);

exports.upload = function (req, res) {
    if (!Object.keys(req.files).length) {
        res.json({
            success: false,
            message: 'file.upload.noFile'
        });
    }
    Object.keys(req.files).forEach(function(key) {
        var file = req.files[key];
        var writestream = grid.createWriteStream({ filename: file.name });
        fs.createReadStream(file.path)
            .on('end', function() {
                console.log('end');
            })
            .on('error', function(err) {
                console.log('error');
                console.log(err);
            })
            .pipe(writestream);
    });


};