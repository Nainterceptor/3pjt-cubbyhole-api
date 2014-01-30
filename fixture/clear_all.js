var fixtures = require('pow-mongodb-fixtures').connect('cubbyhole');

fixtures.clear(function(err) {
    console.log('Collections clear');
    process.exit(0);
});