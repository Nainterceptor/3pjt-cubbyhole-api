var mongoose = require('mongoose');
var Plans = require('./plans.js');

exports.users={
    admin: {
        _id: mongoose.Types.ObjectId(),
        email: 'admin@admin.com',
        password: 'admin',
        plan: {
            _id: Plans.plans.insane._id,
            name: "Insane",
            price: 20,
            duration: 2592000,
            storage: 214748364800,
            bandwidth: 0,
            quota: 0
        },
        admin: true
    },
    foobar :{
        _id: mongoose.Types.ObjectId(),
        email: 'foo@bar.com',
        password: 'foobar',
        plan: {
            _id: Plans.plans.premium._id,
            name: "Premium",
            price: 10,
            duration: 2592000,
            storage: 53687091200,
            bandwidth: 1048576,
            quota: 5368709120
        }
    },
    barfoo: {
        _id: mongoose.Types.ObjectId(),
        email: 'bar@foo.com',
        password: 'barfoo',
        plan: {
            _id: Plans.plans.free._id,
            name: "Free",
            price: 0,
            duration: 0,
            storage: 5368709120,
            bandwidth: 40960,
            quota: 209715200
        }
    }
};