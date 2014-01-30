var fixtures = require('pow-mongodb-fixtures').connect('cubbyhole');
var fs = require('fs');
var eventEmitter = require('events').EventEmitter;
var endEvent = new eventEmitter;

fs.readdir('./fixtures', function(err, files){
    for (var i = 0; i< files.length; i++){
        var path = './fixtures/'+files[i];
        var j = 0;
        fixtures.clearAndLoad(path, function (){
            j++;
            if (j == files.length){
                endEvent.emit('end', '\n-- FIN DU MAPPAGE --');
            }
        });
        console.log('\nMappage :');
        console.log(require(path));
    }
    endEvent.on('end', function(message){
        console.log(message);
        process.exit();
    });
});

