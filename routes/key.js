module.exports = function (router) {

    router.get('/key/:id', function(req, res){
        const user_id = parseInt(req.params.id);
        const database = req.app.get('database');
        database.UserKeyModel.findOne({
            'uk_user_id': user_id
        }, function(err, result){
            if(err)
                throw err;
            if(result && req.user.user_id === user_id)
                res.json({public_key: result.uk_public_key, private_key: result.uk_private_key});
            else if(result && req.user.user_id !== user_id)
                res.json({public_key: result.uk_public_key});
            else
                res.json({err:"no key"});
        })
    })
};