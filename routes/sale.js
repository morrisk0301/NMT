const ipfs_custom = require('../utils/ipfs_custom');
const hash = require('../utils/hash');

function getUserEmail(database, user_id){
    return new Promise(function(resolve, reject){
        database.UserModel.findOne({
            'user_id': user_id
        }, function(err, result){
            if(err)
                reject(err);
            else
                resolve(result.user_email);
        })
    })
}

function addUserEmail(database, sp_data){
    return new Promise(function(resolve, reject){
        let user_array = [];
        sp_data.reduce(function (total, item) {
            return total.then(() => getUserEmail(database, item.sp_user_id).then((user_email) => {
                const query = {
                    sp_id: item.sp_id,
                    user_email: user_email
                };
                user_array.push(query);
            }));
        }, Promise.resolve()).then(function () {
            resolve(user_array);
        });
    })
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
        let vd_array = [];
        sp_data.reduce(function (total, item) {
            return total.then(() => getVDCounterStatusSP(database, item.sp_id).then((vd_data) => {
                if(!vd_data)
                    return;
                const query = {
                    sp_id: item.sp_id,
                    vd_accuracy: vd_data.vd_accuracy,
                    vd_counter: vd_data.vd_counter,
                    vd_status: vd_data.vd_status
                };
                vd_array.push(query);
            }));
        }, Promise.resolve()).then(function () {
            resolve(vd_array);
        });
    });
}

module.exports = function (router) {

    router.get('/sale/:trade_id', function(req, res){
        if(!req.user)
            return res.json({login: false});

        const database = req.app.get('database');
        const trade_id = req.params.trade_id;
        database.TradeModel.findOne({
            'trade_id': trade_id
        }).then((trade_result) => {
            if(req.user.user_id !== trade_result.trade_user_id)
                process.nextTick(function(){
                    res.json({buyer: false});
                });
            else{
                database.SaleParticipantModel.find({
                    'sp_trade_id': trade_id
                }, async function(err, sale_results){
                    const vd_data = await addVDCounterStatusSP(database, sale_results);
                    const user_data = await addUserEmail(database, sale_results);
                    res.json({sale: sale_results, vd_data: vd_data, user_data: user_data});
                });
            }
        })
    });

    router.get('/sale/:trade_id/:sp_id', function(req, res){
        if(!req.user)
            return res.json({login: false});

        const database = req.app.get('database');
        const trade_id = req.params.trade_id;
        const sp_id = req.params.sp_id;
        database.TradeModel.findOne({
            'trade_id': trade_id
        }).then((trade_result) => {
            if(req.user.user_id !== trade_result.trade_user_id)
                process.nextTick(function(){
                    res.json({buyer: false});
                });
            else{
                database.SaleParticipantModel.findOne({
                    'sp_id': sp_id
                }).then((sale_result) =>{
                    res.json(sale_result);
                });
            }
        })
    });

    router.post('/sale', async function (req, res) {
        if (!req.user)
            return res.json({login: false});

        const database = req.app.get('database');
        const sp_trade_id = req.body.sp_trade_id;
        const sp_user_id = req.user.user_id;
        const sp_user_address = req.body.sp_user_address;
        const sp_file_name = req.body.sp_file_name;
        const sp_detail = req.body.sp_detail;
        const sp_server_hash = await hash.generateHash(32);
        const sp_file_hash = req.body.file_hash;
        const sp_key = req.body.sp_key;
        const newSale = new database.SaleParticipantModel({
            'sp_trade_id': sp_trade_id,
            'sp_user_id': sp_user_id,
            'sp_user_address': sp_user_address,
            'sp_file_name': sp_file_name,
            'sp_detail': sp_detail,
            'sp_server_hash': sp_server_hash,
            'sp_file_hash': sp_file_hash,
            'sp_key': sp_key
        });

        newSale.save(function (err, result) {
            if (err)
                throw err;
            process.nextTick(async function(){
                await ipfs_custom.storeFileFromHash(sp_file_hash, result, database);
            });
            res.json({post_trade: true});
        })
    })

};