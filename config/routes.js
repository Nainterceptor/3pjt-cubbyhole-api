var index = require('../routes/indexController');
var user = require('../routes/userController');
var plan = require('../routes/planController');

module.exports = function (app, passport) {
    app.get('/', index.index);

    app.put('/user/registration', user.create);
    app.get('/user/get', passport.authenticate('bearer', { session: false }), user.getOne);
    app.delete('/user/remove', user.remove)
    app.post('/user/login', user.login)

    app.put('/plan/create', plan.create);
    app.get('/plan/get', plan.get);
    app.delete('/plan/remove', plan.remove);
    app.post('/plan/update', plan.update);
};