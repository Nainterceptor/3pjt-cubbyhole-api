var index = require('../routes/index');
var user = require('../routes/user');

module.exports = function (app) {
    app.get('/', index.index);
    app.put('/user/create', user.create);
};