const checkLogin = require('../utils/check_login');
const data_verification = require('../utils/data_verification');
const hash = require('../utils/hash');
const essential_info = require('../utils/essential_info');

function newVerification(database, user_id, user_address) {
    return new Promise(async function (resolve, reject) {
        const verificationData = await data_verification.getNewVerificationImage(database, user_id);

        if (!verificationData.data) {
            process.nextTick(function () {
                resolve(null);
            })
        } else {
            const serverHash = await hash.generateHash(32);
            const newVP = new database.VerificationParticipantModel({
                'vp_trade_id': verificationData.trade_id,
                'vp_vd_id': verificationData.vd_id,
                'vp_user_id': user_id,
                'vp_user_address': user_address,
                'vp_data_length': verificationData.data.length,
                'vp_server_hash': serverHash
            });

            newVP.save((err, result) => {
                if (err)
                    reject(err);
                else
                    resolve({
                        vp_id: result.vp_id,
                        data: verificationData.data,
                        trade_id: verificationData.trade_id
                    })
            })
        }
    })
}

function getVerificationCommand(database, trade_id) {
    return new Promise(function (resolve, reject) {
        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, result) {
            if (err)
                reject(err);
            else {
                resolve(result.trade_verification_command);
            }
        })
    })
}

function getTradeHead(database, trade_id) {
    return new Promise(function (resolve, reject) {
        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result.trade_head)
        })
    })
}

function addTradeHead(database, sp_data) {
    return new Promise(function (resolve, reject) {
        let sp_modified = [];
        sp_data.reduce(function (total, item) {
            return total.then(() => getTradeHead(database, item.sp_trade_id).then((trade_head) => {
                item.trade_head = trade_head;
                sp_modified.push(item);
            }));
        }, Promise.resolve()).then(function () {
            resolve(sp_modified);
        });
    });
}

function getVDCounterStatus(database, vd_id){
    return new Promise(function(resolve, reject){
        database.VerificationDataModel.findOne({
            'vd_id': vd_id
        }).select('vd_counter vd_status').exec(function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        })
    })
}

function addVDCounterStatus(database, vp_data) {
    return new Promise(function (resolve, reject) {
        let vp_modified = [];
        vp_data.reduce(function (total, item) {
            return total.then(() => getVDCounterStatus(database, item.vp_vd_id).then((vd_data) => {
                item.vd_counter = vd_data.vd_counter;
                item.vd_status = vd_data.vd_status;
                vp_modified.push(item);
            }));
        }, Promise.resolve()).then(function () {
            resolve(vp_modified);
        });
    });
}

function getVDCounterStatusSP(database, sp_id){
    return new Promise(function(resolve, reject){
        database.VerificationDataModel.findOne({
            'vd_sp_id': sp_id
        }).select('vd_counter vd_status vd_accuracy').exec(function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        })
    })
}

function addVDCounterStatusSP(database, sp_data) {
    return new Promise(function (resolve, reject) {
        let sp_modified = [];
        sp_data.reduce(function (total, item) {
            return total.then(() => getVDCounterStatusSP(database, item.sp_id).then((vd_data) => {
                item.vd_counter = vd_data.vd_counter;
                item.vd_status = vd_data.vd_status;
                item.vd_accuracy = vd_data.vd_accuracy;
                sp_modified.push(item);
            }));
        }, Promise.resolve()).then(function () {
            resolve(sp_modified);
        });
    });
}

function checkVerified(database, user_id){
    return new Promise(function(resolve, reject){
        database.VerificationApplyModel.findOne({
            'va_user_id': user_id
        }, function(err, result){
            if(err)
                reject(err);
            else{
                if(result.va_is_verified)
                    resolve(true);
                else
                    resolve(false);
            }
        })
    })
}

function getVDId(database, sp_id) {
    return new Promise(function (resolve, reject) {
        database.VerificationDataModel.findOne({
            'vd_sp_id': sp_id
        }, function (err, result) {
            resolve(result.vd_id);
        })
    })
}

function getUserInfo(database, id_array){
    return new Promise(function(resolve, reject){
        database.UserModel.find({
            'user_id' : {$in: id_array}
        }, function(err, results){
            resolve(results);
        })
    })
}

module.exports = function (router) {

    router.get('/', function (req, res, next) {
        if (!req.user)
            res.render('index', {login: false, user_email: null, user_type:null});
        else
            res.render('index', {login: true, user_email: req.user.user_email, user_type: req.user.user_type});
    });

    router.get('/test', function (req, res, next) {
        res.render('test');
    });

    router.get('/login', function (req, res) {
        res.render('login');
    });

    router.get('/signup', function (req, res) {
        res.render('signup');
    });

    router.get('/forgot', function (req, res) {
        res.render('forgot');
    });

    router.get('/buy', checkLogin, function (req, res) {
        res.render('buy', {user_email: req.user.user_email, user_type: req.user.user_type});
    });

    router.get('/buy_done', checkLogin, function (req, res) {
        res.render('buy_done', {user_email: req.user.user_email, user_type: req.user.user_type});
    });

    router.get('/view_trade', function (req, res) {
        const trade_id = req.query.trade_id;
        const page = req.query.page ? req.query.page : 1;
        const database = req.app.get('database');

        if (!trade_id) {
            database.TradeModel.paginate({}, {
                page: page,
                limit: 6,
                sort: {created_at: -1},
                select: 'trade_id trade_head trade_contract_address trade_img'
            }, function (err, result) {
                if (err)
                    throw err;
                if (!req.user)
                    res.render('view_trade', {login: false, user_email: null, trade: result.docs, num: result.total, user_type: null});
                else
                    res.render('view_trade', {
                        login: true,
                        user_email: req.user.user_email,
                        user_type: req.user.user_type,
                        trade: result.docs,
                        num: result.total
                    });
            });
        } else {
            database.TradeModel.findOne({
                'trade_id': trade_id
            }, function (err, result) {
                if (err)
                    throw err;
                if (!req.user)
                    res.render('tradeinfo', {login: false, user_email: null, trade: result, user_type: null});
                else
                    res.render('tradeinfo', {login: true, user_email: req.user.user_email, trade: result, user_type: req.user.user_type});
            });
        }

    });

    router.get('/sell', checkLogin, function (req, res) {
        const trade_id = req.query.trade_id;
        const database = req.app.get('database');
        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, result) {
            if (err)
                throw err;
            res.render('sell', {user_email: req.user.user_email, trade: result, user_type: req.user.user_type});
        });
    });

    router.get('/sell_done', checkLogin, function (req, res) {
        res.render('sell_done', {user_email: req.user.user_email, user_type: req.user.user_type});
    });

    router.get('/verify_warning', checkLogin, function (req, res) {
        res.render('verify_warning', {user_email: req.user.user_email, user_type: req.user.user_type});
    });

    router.get('/user_verify', checkLogin, async function (req, res) {
        const database = req.app.get('database');
        const user_address = req.query.address;
        const user_id = req.user.user_id;

        const verified = await checkVerified(database, user_id);
        if(!verified) {
            process.nextTick((function(){
                res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                res.write('<script type="text/javascript">alert("등록된 검증자가 아닙니다. 검증자 신청을 해주세요");window.history.back();</script>');
                res.end();
            }))
        }
        else {
            database.VerificationParticipantModel.findOne({
                'vp_user_id': user_id,
                'vp_is_finished': false
            }, async function (err, result) {
                if (!result) {
                    const newVP = await newVerification(database, user_id, user_address);
                    if (!newVP)
                        process.nextTick(function () {
                            res.render('user_verify', {
                                user_email: req.user.user_email,
                                user_type: req.user.user_type,
                                vp_id: null,
                                verification_command: null,
                                data: []
                            })
                        });
                    else {
                        const verification_command = await getVerificationCommand(database, newVP.trade_id);
                        res.render('user_verify', {
                            user_email: req.user.user_email,
                            user_type: req.user.user_type,
                            vp_id: newVP.vp_id,
                            verification_command: verification_command,
                            data: newVP.data
                        })
                    }
                } else {
                    const start_idx = result.vp_data ? result.vp_data.length : 0;
                    const oldVP = await data_verification.getOldVerificationImage(database, result.vp_vd_id, start_idx);
                    const verification_command = await getVerificationCommand(database, result.vp_trade_id);

                    res.render('user_verify', {
                        user_email: req.user.user_email,
                        user_type: req.user.user_type,
                        vp_id: result.vp_id,
                        verification_command: verification_command,
                        data: oldVP.data
                    });
                }
            })
        }
    });

    router.get('/verify_done', checkLogin, function (req, res) {
        res.render('verify_done', {user_email: req.user.user_email, user_type: req.user.user_type});
    });

    router.get('/my_buy', checkLogin, function (req, res) {
        const database = req.app.get('database');
        const page = req.query.page ? req.query.page : 1;

        database.TradeModel.paginate({
            'trade_user_id': req.user.user_id
        }, {
            page: page,
            limit: 15,
            sort: {created_at: -1},
        }, function (err, results) {
            if (err)
                throw err;
            res.render('my_buy', {user_email: req.user.user_email, trade: results.docs, num: results.total, user_id: req.user.user_id, user_type: req.user.user_type});
        });
    });

    router.get('/my_sell', checkLogin, function (req, res) {
        const database = req.app.get('database');
        const page = req.query.page ? req.query.page : 1;

        database.SaleParticipantModel.paginate({
            'sp_user_id': req.user.user_id
        }, {
            page: page,
            limit: 15,
            sort: {created_at: -1},
        }, async function (err, results) {
            if (err)
                throw err;
            addTradeHead(database, results.docs).then(async (sp_data)=>{
                const sp_data_mod = await addVDCounterStatusSP(database, sp_data);
                res.render('my_sell', {user_email: req.user.user_email, sale: sp_data_mod, num: results.total,  DATA_VERIFIER_NUM: essential_info.DATA_VERIFIER_NUM, user_type: req.user.user_type});
            });
        });
    });

    router.get('/my_verify', checkLogin, function (req, res) {
        const database = req.app.get('database');
        const page = req.query.page ? req.query.page : 1;

        database.VerificationParticipantModel.paginate({
            'vp_user_id': req.user.user_id
        }, {
            page: page,
            limit: 15,
            sort: {created_at: -1},
        }, async function (err, results) {
            if(err)
                throw err;
            const vp_data = await addVDCounterStatus(database, results.docs);
            res.render('my_verify', {user_email: req.user.user_email, verify: vp_data, num: results.total, DATA_VERIFIER_NUM: essential_info.DATA_VERIFIER_NUM, user_type: req.user.user_type});
        });
    });

    router.get('/mytrade/:trade_id', checkLogin, function (req, res) {
        const trade_id = req.params.trade_id;
        const user_id = req.user.user_id;
        res.render('mytradeinfo', {trade_id: trade_id, user_id: user_id, user_type: req.user.user_type});
    });

    router.get('/verifier', checkLogin, function(req, res){
        const database = req.app.get('database');
        database.VerificationApplyModel.findOne({
            'va_user_id': req.user.user_id
        }, function(err, result){
            if(!result)
                res.render('verifier', {user_email: req.user.user_email, user_name: req.user.user_name, user_type: req.user.user_type});
            else if(!result.va_is_verified){
                res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                res.write('<script type="text/javascript">alert("관리자 승인 대기중입니다");window.history.back();</script>');
                res.end();
            }
            else if(result.va_is_verified){
                res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                res.write('<script type="text/javascript">alert("이미 승인된 검증자입니다");window.history.back();</script>');
                res.end();
            }
        })
    });

    router.get('/auth_verifier', checkLogin, function (req, res) {
        const database = req.app.get('database');
        const page = req.query.page ? req.query.page : 1;

        database.VerificationApplyModel.paginate({}, {
            page: page,
            limit: 5,
            sort: {created_at: -1},
            select: 'va_id va_name va_phone va_is_verified created_at'
        }, function (err, result) {
            if (err)
                throw err;
            res.render('auth_verifier', {user_email: req.user.user_email, user_type: req.user.user_type, va: result.docs, num: result.total});
        });
    });

    router.get('/verification_detail', checkLogin, async function(req, res){
        const database = req.app.get('database');
        const sp_id = req.query.sp_id;
        const vd_id = await getVDId(database, sp_id);

        database.VerificationParticipantModel.find({
            'vp_vd_id': vd_id
        }).select('vp_detail vp_user_id').exec(async function(err, results){
            let id_array = [];
            results.forEach(function(item){
                id_array.push(item.vp_user_id);
            });
            const user_info = await getUserInfo(database, id_array);
            res.render('verification_detail', {va: results, user: user_info});
        })
    });



    /*
    router.get('/withdrawal', function (req, res) {
        if (!req.user)
            res.redirect('/login');
        else
            res.render('withdrawal');
    });
    */
};