const category = require('../utils/category');

module.exports = function (router) {

    router.get('/trade', function (req, res) {
        const database = req.app.get('database');
        database.TradeModel.find().select('trade_id trade_head trade_contract_address trade_user_id trade_status created_at').sort('-created_at').exec(function (err, result) {
            if (err)
                throw err;
            res.json(result);
        });
    });

    router.get('/category', function(req, res){
        res.json(category.image_category);
    });

    router.get('/trade/:id', function (req, res) {
        const database = req.app.get('database');
        const trade_id = req.params.id;

        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, result) {
            if (err)
                throw err;
            res.json(result);
        })
    });

    router.post('/trade', function (req, res) {
        if (!req.user)
            return res.json({login: false});

        const database = req.app.get('database');
        const trade_head = req.body.trade_head;
        const trade_body = req.body.trade_body;
        const trade_category = req.body.trade_category;
        const trade_verification_command = req.body.trade_verification_command;
        const trade_contract_address = req.body.trade_contract_address;
        const trade_img = req.body.trade_img ? JSON.parse(req.body.trade_img) : "";
        const new_trade = new database.TradeModel({
            'trade_head': trade_head,
            'trade_body': trade_body,
            'trade_category': trade_category,
            'trade_verification_command': trade_verification_command,
            'trade_img': trade_img,
            'trade_major_big': req.body.major_big,
            'trade_major_small': req.body.major_small,
            'trade_contract_address': trade_contract_address,
            'trade_user_id': req.user.user_id,
        });

        new_trade.save(function (err) {
            if (err)
                throw err;
            res.json({post_trade: true});
        })
    });

    router.put('/trade', function (req, res) {
        if (!req.user)
            return res.json({login: false});

        const database = req.app.get('database');
        const trade_id = req.body.trade_id;
        const trade_head = req.body.trade_head;
        const trade_body = req.body.trade_body;
        const trade_category = req.body.trade_category;
        const trade_verification_command = req.body.trade_verification_command;
        const trade_img = req.body.trade_img ? JSON.parse(req.body.trade_img) : "";

        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, trade) {
            if (err)
                throw err;
            if (trade.trade_user_id !== req.user.user_id)
                return res.json({trade_user_id: false});

            trade.trade_head = trade_head;
            trade.trade_body = trade_body;
            trade.trade_category = trade_category;
            trade.trade_verification_command = trade_verification_command;
            trade.trade_img = trade_img;
            trade.updated_at = Date.now();

            trade.save(function (err) {
                if (err)
                    throw err;
                res.json({put_trade: true});
            })
        })
    })
};