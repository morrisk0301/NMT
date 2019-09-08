const data_verification = require('../utils/data_verification');
const hash = require('../utils/hash');
const sort = require('../utils/sort');
const checkLogin = require('../utils/check_login');
const category = require('../utils/category');

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

module.exports = function (router) {

    router.get('/verification/:type/:address', checkLogin, async function (req, res) {
        if (!req.user)
            return res.json({login: false});
        else if (req.params.address === "undefined")
            return res.json({metamask: false});

        const database = req.app.get('database');
        const dataType = req.params.type;
        const user_address = req.params.address;
        const user_id = req.user.user_id;

        if (dataType === 'image') {
            database.VerificationParticipantModel.findOne({
                'vp_user_id': user_id,
                'vp_is_finished': false
            }, async function (err, result) {
                if (!result) {
                    const newVP = await newVerification(database, user_id, user_address);
                    if (!newVP)
                        process.nextTick(function () {
                            res.json({err: "검증 데이터가 존재하지 않습니다."});
                        });
                    else {
                        const verification_command = await getVerificationCommand(database, newVP.trade_id);
                        res.json({vp_id: newVP.vp_id, verification_command: verification_command, data: newVP.data});
                    }
                } else {
                    const start_idx = result.vp_data ? result.vp_data.length : 0;
                    const oldVP = await data_verification.getOldVerificationImage(database, result.vp_vd_id, start_idx);
                    const verification_command = await getVerificationCommand(database, result.vp_trade_id);

                    res.json({vp_id: result.vp_id, verification_command: verification_command, data: oldVP.data});
                }
            })
        }
    });

    router.get('/verification_category', checkLogin, function(req, res){
        const major_big = category.major_big;
        const major_small = category.major_small;

        res.json({major_big: major_big, major_small: major_small});
    });

    router.get('/verifier/:id', checkLogin, function(req, res){
        const database = req.app.get('database');
        database.VerificationApplyModel.findOne({
            'va_id': req.params.id
        }, function(err, result){
            if(err)
                console.log(err);
            res.json(result);
        })

    });

    router.post('/verifier', checkLogin, function(req, res){
        const database = req.app.get('database');
        const newVA = new database.VerificationApplyModel({
            'va_user_id': req.user.user_id,
            'va_name': req.body.name,
            'va_phone': req.body.phone,
            'va_major_big': req.body.major_big,
            'va_major_small': req.body.major_small,
            'va_academic': req.body.academic,
            'va_academic_img': req.body.academic_img,
            'va_year': req.body.year,
            'va_year_img': req.body.year_img,
        });
        newVA.save(function(err){
            if(err)
                throw err;
            res.json(true);
        })
    });

    router.put('/verification/:type/:vp_id', checkLogin, function (req, res) {
        if (!req.user)
            return res.json({login: false});
        const database = req.app.get('database');
        const dataType = req.params.Type;
        const vp_id = req.params.vp_id;
        const verification_data = JSON.parse(req.body.data);

        database.VerificationParticipantModel.findOne({
            'vp_id': vp_id
        }, function (err, result) {
            result.vp_data = result.vp_data.concat(verification_data);
            result.vp_data = result.vp_data.sort(sort.sortWithIndex);
            result.vp_detail = req.body.detail;
            result.vp_is_finished = result.vp_data.length === result.vp_data_length;
            result.save(function (err, result) {
                if (err)
                    throw err;
                if (result.vp_is_finished) {
                    process.nextTick(async function () {
                        await data_verification.emitVD(database, result);
                    });
                }
                res.json({put_verification: true});
            })
        })
    });

    router.put('/verifier/:id', checkLogin, function(req, res){
        const database = req.app.get('database');

        database.VerificationApplyModel.findOne({
            'va_id': req.params.id
        }, function(err, result){
            result.va_is_verified = true;
            result.save(function(err){
                res.json(true);
            })
        })
    })
};