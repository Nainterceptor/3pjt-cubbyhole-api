var utils = require('util');
module.exports.error = function (err, cb) {
    if (err.name == 'ValidationError') {
        var messages = {
            'required': "validator.%s.isEmpty",
            'min': "validator.%s.isTooShort",
            'max': "validator.%s.isTooLong",
            'enum': "validator.%s.isNotAllowedValue"
        };
        Object.keys(err.errors).forEach(function (field) {
            var eObj = err.errors[field];
            if (messages.hasOwnProperty(eObj.type)) {
                eObj.message = utils.format(messages[eObj.type], eObj.path);
            }
        });
    }
};