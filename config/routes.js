var index = require('../routes/indexController');
var user = require('../routes/userController');

module.exports = function (app) {
    app.get('/', index.index);

    app.put('/user/registration', user.create);
    app.get('/user/get', user.getOne);
    app.delete('/user/remove', user.remove)
};