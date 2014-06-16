var index = require('../controllers/indexController');
var user = require('../controllers/userController');
var plan = require('../controllers/planController');
var directory = require('../controllers/directoryController');
var file = require('../controllers/fileController');
var auth = require('../helpers/token');
module.exports = function (app) {
    var isLogged = auth.isLogged;
    var isAdmin = auth.isAdmin;
    var has = auth.has;
    var doubleCheck = auth.doubleCheck;
    var transparentLoggedUser = auth.transparentLoggedUser;
    var isPublicOrIsLogged = auth.isPublicOrIsLogged;

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
    app.get('/files/list/:directory', isLogged, file.list);
    app.get('/files/list', isLogged, file.list);
    app.get('/file/download/:file', isPublicOrIsLogged, file.download);
    app.delete('/file/remove/:file', isLogged, has('RW+'), file.remove);
    app.post('/file/update/:file/edit-rights', isLogged, has('RW+'), file.editRights);

    app.post('/directory/create', isLogged, directory.create);
    app.get('/directory/get-breadcrumb/:directory', isLogged, has('R'), directory.getBreadcrumb);
    app.post('/directory/update/:directory', isLogged, has('RW'), directory.update);
    app.delete('/directory/remove/:directory', isLogged, has('RW+'), directory.remove);
    app.post('/directory/update/:directory/edit-rights', isLogged, has('RW+'), directory.editRights);
};