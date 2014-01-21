
/**
 * Module dependencies.
 */

var express = require('express');
var mongoose = require('mongoose');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();
var env = process.env.NODE_ENV || 'development';
var config = require('./config/config')[env];
var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(config.db, options);
}();
// Error handler
mongoose.connection.on('error', function (err) {
    console.log(err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
    connect();
});

// Bootstrap models
var models_path = __dirname + '/models';
fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js')) require(models_path + '/' + file);
});

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.bodyParser());
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
