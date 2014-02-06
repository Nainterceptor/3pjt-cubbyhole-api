
/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var http = require('http');
var fs = require('fs');

//Clean TMP directory
var tmpDir = __dirname + '/tmp';
fs.readdirSync(tmpDir).forEach(function (file) {
    if (!~file.indexOf('.gitkeep'))
        fs.unlink(tmpDir + '/' + file);
});

var app = express();
var env = process.env.NODE_ENV || 'development';
var config = require('./config/config')[env];
var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    global.db = mongoose.createConnection(config.db, options);
}();
// Error handler
global.db.on('error', function (err) {
    console.log(err);
});

// Reconnect when closed
global.db.on('disconnected', function () {
    connect();
});

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.json());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Bootstrap routes
require('./config/routes')(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
