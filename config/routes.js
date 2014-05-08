var index = require('../routes/indexController');
var user = require('../routes/userController');
var plan = require('../routes/planController');
var directory = require('../routes/directoryController');
var file = require('../routes/fileController');
var auth = require('../helpers/token');
module.exports = function (app) {
    var isLogged = auth.isLogged;
    var isAdmin = auth.isAdmin;
    var doubleCheck = auth.doubleCheck;
    var transparentLoggedUser = auth.transparentLoggedUser;

    app.get('/', index.index);

    app.get('/users', isLogged, isAdmin, user.getAll);
    app.post('/user/registration', user.create);
    app.post('/user/login', user.login);
    app.post('/user/renew', user.renew);
    app.get('/user/get', isLogged, isAdmin, user.getOne);
    app.delete('/user/remove', isLogged, isAdmin, user.remove);
    app.post('/user/update/:id', isLogged, isAdmin, user.update);
    app.get('/user/my/get', isLogged, user.getMy);
    app.delete('/user/my/remove', isLogged, doubleCheck, user.removeMy);
    app.post('/user/my/update', isLogged, doubleCheck, user.updateMy);
    app.put('/user/my/subscribe', isLogged, user.subscribeToPlan);

    app.post('/plan/create', isLogged, isAdmin, plan.create);
    app.get('/plan/get', plan.get);
    app.delete('/plan/remove', isLogged, isAdmin, plan.remove);
    app.post('/plan/update', isLogged, isAdmin, plan.update);

    app.post('/file/upload', isLogged, file.upload);
    app.get('/file/download/:id', transparentLoggedUser, file.download);

    app.post('/directory/create', isLogged, directory.create);
    app.get('/directory/get', isLogged, directory.getOne);
};