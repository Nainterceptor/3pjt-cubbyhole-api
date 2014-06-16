var mongoose = require('mongoose');

exports.plans={
    free: {
        _id: mongoose.Types.ObjectId(),
        name: "Free",
        price: 0,
        duration: 0,
        storage: 5368709120,
        bandwidth: 40960,
        quota: 209715200
    },
    premium: {
        _id: mongoose.Types.ObjectId(),
        name: "Premium",
        price: 10,
        duration: 2592000,
        storage: 53687091200,
        bandwidth: 1048576,
        quota: 5368709120
    },
    insane: {
        _id: mongoose.Types.ObjectId(),
        name: "Insane",
        price: 20,
        duration: 2592000,
        storage: 214748364800,
        bandwidth: 0,
        quota: 0
    }
};