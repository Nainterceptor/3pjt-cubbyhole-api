var mongoose = require('mongoose');
var Users = require('./users.js');

exports.directories = {
    folder1: {
        _id: mongoose.Types.ObjectId(),
        name: 'Folder 1',
        users: [
            {
                _id: Users.users.admin._id,
                email: 'admin@admin.com',
                rights: 'RW+'
            },
            {
                _id: Users.users.foobar._id,
                email: 'foo@bar.com',
                rights: 'RW'
            },
            {
                _id: Users.users.barfoo._id,
                email: 'bar@foo.com',
                rights: 'R'
            }
        ]
    },
    folder2: {
        _id: mongoose.Types.ObjectId(),
        name: 'Folder 2',
        users: [
            {
                _id: Users.users.admin._id,
                email: 'admin@admin.com',
                rights: 'RW+'
            },
            {
                _id: Users.users.foobar._id,
                email: 'foo@bar.com',
                rights: 'RW+'
            }
        ]
    },
    folderChild1: {
        _id: mongoose.Types.ObjectId(),
        name: 'Folder Child 1',
        users: [
            {
                _id: Users.users.admin._id,
                email: 'admin@admin.com',
                rights: 'RW+'
            },
            {
                _id: Users.users.foobar._id,
                email: 'foo@bar.com',
                rights: ''
            },
            {
                _id: Users.users.barfoo._id,
                email: 'bar@foo.com',
                rights: 'RW+'
            }
        ],
        parent: 'folder1'
    }
};