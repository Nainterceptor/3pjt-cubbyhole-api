
/*
 * GET home page.
 */

exports.index = function(req, res){
    var json = {
        serverStatus: 'I\'m alive !'
    };
    res.json(json);
};