var Plan = require('../models/planModel');
var validatorHelper = require('../helpers/validator.js');
var jsonMask = require('json-mask');
/*
 * PUT plan
 */

exports.create = function(req, res, next) {
    var plan = new Plan(req.body);
    plan.save(function(err) {
        if (err)
            var result;
        if (err) {
            validatorHelper.error(err);
            result = {
                success: false,
                errors: err.errors,
                message: 'validator.error'
            };
        } else {
            result = {
                success: true,
                message: 'plan.create.success',
                plan: jsonMask(plan, Plan.gettables())
            };
        }
        res.json(result);
    });
};

exports.get = function(req, res, next) {
    var searchOn = jsonMask(req.query, Plan.searchable());
    if (searchOn == null){
        Plan.find(null, function (err, docs){
            var plans = jsonMask(docs, Plan.gettables());
            var result;
            if (plans ==null){
                result = {
                    success: false,
                    message: 'noplans'
                };
            } else {
                result = {
                    success: true,
                    message: 'plans',
                    plans: plans
                };
            }
            res.json(result);
        });
    } else {
        Plan.findOne(searchOn).exec(function(err, doc) {
            var plan = jsonMask(doc, Plan.gettables());
            var result;
            if (plan == null) {
                result = {
                    success: false,
                    message: 'plan.notFound'
                };
            } else {
                result = {
                    success: true,
                    message: 'plan.one',
                    plan: plan
                };
            }
            res.json(result);
        });
    }
};

exports.remove = function(req, res, next) {
    var searchOn = jsonMask(req.body, Plan.searchable());
    var result;
    if (searchOn == null){
        result = {
            success: false,
            message: 'plan.searchForbidden'
        };
        res.json(result);
    } else {
        Plan.findOneAndRemove(searchOn, function(err, doc) {
            var plan = jsonMask(doc, Plan.gettables());
            if(doc == null) {
                result = {
                    success: false,
                    message: 'plan.notFound'
                };
            } else {
                result = {
                    success: true,
                    message: 'plan.deleted',
                    plan: plan
                };
            }
            res.json(result);
        });
    }
};

exports.update = function (req, res, next){
    var searchOn = jsonMask(req.query, Plan.searchable());
    var updateOn = jsonMask(req.body, Plan.settables());
    var result;
    if (searchOn == null){
        result = {
            success: false,
            message: 'plan.searchForbidden'
        };
        res.json(result);
    } else if (updateOn == null){
        result = {
            success: false,
            message: 'plan.updateForbidden'
        };
        res.json(result);
    } else {
        Plan.findOne(searchOn, function (err, plan) {
            Object.keys(updateOn).forEach(function(key) {
                var val = updateOn[key];
                plan.set(key, val);
            });
            plan.save(function(saveErr, newPlan) {
                var result;
                if (saveErr) {
                    validatorHelper.error(saveErr);
                    result = {
                        success: false,
                        errors: saveErr.errors,
                        message: 'validator.error'
                    };
                } else {
                    result = {
                        success: true,
                        message: 'plan.update.success',
                        plan: jsonMask(newPlan, Plan.gettables())
                    };
                }
                res.json(result);
            });
        });
    }
};

