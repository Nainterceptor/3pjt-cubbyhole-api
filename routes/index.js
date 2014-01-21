
/*
 * GET home page.
 */

exports.index = function(req, res){
    var json = {
        success: true,
        message: 'I\'m alive !'
    };
    res.json(json);
};