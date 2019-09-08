module.exports = function (router) {

    const token_info = require('../utils/token_info');

    router.get('/nmt_address', function (req, res) {
        res.json({NMT_ADDRESS: token_info.NMT_ADDRESS});
    });

    router.get('/nmt_abi', function (req, res) {
        res.json({NMT_ABI: token_info.NMT_ABI});
    });

    router.get('/nmt_trade_abi', function (req, res) {
        res.json({NMT_TRADE_ABI: token_info.NMT_TRADE_ABI});
    });

};