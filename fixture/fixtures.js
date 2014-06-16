var fixtures = require('pow-mongodb-fixtures').connect('cubbyhole');
var fs = require('fs');
var crypto = require('crypto');
var eventEmitter = require('events').EventEmitter;
var endEvent = new eventEmitter;

var encryptPassword = function (password, salt) {
    if (!password)
        return '';
    var encrypted;
    try {
        encrypted = crypto.createHmac('sha1', salt).update(password).digest('hex');
        return encrypted;
    } catch (err) {
        return '';
    }
};

var makeSalt = function () {
    return Math.round((new Date().valueOf() * Math.random())) + ''
};

fs.readdir(__dirname+'/fixtures/', function(err, files){
    for (var i = 0; i< files.length; i++){
        var path = __dirname+'/fixtures/'+files[i];
        var j = 0;

        if (files[i] === 'users.js') {
            var users = require(path).users;
            for (k in users) {
                var user = {};
                user._id = users[k]._id;
                user.email = users[k].email;
                user.plan = users[k].plan;
                user.salt = makeSalt();
                user.hashed_password = encryptPassword(users[k].password, user.salt);
                user.created = Date.now();
                if (users[k].admin) {
                    user.admin = true;
                }
                users[k] = user;
            }
            fixtures.clearAndLoad(path, function () {
                j++;
                if (j == files.length) {
                    endEvent.emit('end', '\n-- FIN DU MAPPAGE --');
                }
            });
            console.log('\nMappage :');
            console.log(require(path));
        } else if (files[i] == 'directories.js') {
            var directories = require(path).directories;
            for (l in directories){
                if (directories[l].parent){
                    directories[l].parent = directories[directories[l].parent]._id;
                }
                directories[l].path = (directories[l].parent?directories[l].parent.toString()+'#':'') + directories[l]._id.toString();
            }
            fixtures.clearAndLoad(path, function () {
                j++;
                if (j == files.length) {
                    endEvent.emit('end', '\n-- FIN DU MAPPAGE --');
                }
            });
            console.log('\nMappage :');
            console.log(require(path));
        } else {
            fixtures.clearAndLoad(path, function (){
                j++;
                if (j == files.length){
                    endEvent.emit('end', '\n-- FIN DU MAPPAGE --');
                }
            });
            console.log('\nMappage :');
            console.log(require(path));
        }
    }
    endEvent.on('end', function(message){
        console.log(message);
        process.exit();
    });
});

