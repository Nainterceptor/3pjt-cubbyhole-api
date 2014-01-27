var index = require('../routes/indexController');
var user = require('../routes/userController');
var plan = require('../routes/planController');
var auth = require('../helpers/token');
module.exports = function (app) {
    isLogged = auth.isLogged();
    isAdmin = auth.isAdmin();
    doubleCheck = auth.doubleCheck();
    app.get('/', index.index);

    app.put('/user/registration', user.create);
    app.post('/user/login', user.login);
    app.get('/user/get', isLogged, isAdmin, user.getOne);
    app.delete('/user/remove', isLogged, isAdmin, user.remove);
    app.get('/user/my/get', isLogged, user.getMy);
    app.delete('/user/my/remove', isLogged, doubleCheck, user.removeMy);

    app.put('/plan/create', isLogged, isAdmin, plan.create);
    app.get('/plan/get', isLogged, isAdmin, plan.get);
    app.delete('/plan/remove', isLogged, isAdmin, plan.remove);
    app.post('/plan/update', isLogged, isAdmin, plan.update);
};