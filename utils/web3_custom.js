const Web3 = require('web3');
const token_info = require('./token_info');

const web3 = new Web3(new Web3.providers.HttpProvider("http://13.125.53.194:8545"));
const NMT_TRADE_ABI = token_info.NMT_TRADE_ABI;

web3.eth.defaultAccount = token_info.SERVER_ADDREESS;

function getTradeContractAddress(database, trade_id) {
    return new Promise(function (resolve, reject) {
        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, result) {
            if (err)
                reject(err);
            else {
                resolve(result.trade_contract_address);
            }
        });
    })
}

function giveTokens(NaraMalsamiTokenInstance, server_hash) {
    return new Promise(function (resolve, reject) {
        NaraMalsamiTokenInstance.methods.giveTokens(server_hash)
            .send({from: web3.eth.defaultAccount, gas: 200000}, function (err, result) {
                if (err)
                    reject(err);
                else {
                    console.log(server_hash + " hash 값에 대한 토큰 지급 완료! txHash: " + result);
                    resolve(true);
                }
            })
    })
}

function commitSPModel(database, sp_id) {
    return new Promise(function (resolve, reject) {
        database.SaleParticipantModel.findOne({
            'sp_id': sp_id
        }, function (err, result) {
            if (err)
                process.nextTick(function () {
                    reject(err);
                });
            else {
                result.sp_is_committed = true;
                result.committed_at = Date.now();
                result.save(function (err) {
                    resolve(true);
                })
            }
        })
    })
}

function commitVPModel(database, vp_id) {
    return new Promise(function (resolve, reject) {
        database.VerificationParticipantModel.findOne({
            'vp_id': vp_id
        }, function (err, result) {
            if (err)
                process.nextTick(function () {
                    reject(err);
                });
            else {
                result.vp_is_committed = true;
                result.committed_at = Date.now();
                result.save(function (err) {
                    resolve(true);
                })
            }
        })
    })
}

function emitSaleData(database, sp_id, data_num, accuracy) {
    return new Promise(function (resolve, reject) {
        database.SaleParticipantModel.findOne({
            'sp_id': sp_id
        }, async function (err, sp_result) {
            const trade_contract_address = await getTradeContractAddress(database, sp_result.sp_trade_id);
            const NaraMalsamiTokenInstance = web3.eth.Contract(NMT_TRADE_ABI, trade_contract_address);
            NaraMalsamiTokenInstance.methods.emitSeller(
                sp_result.sp_server_hash, data_num, accuracy, sp_result.sp_user_address, sp_result.sp_file_hash
            ).send({from: web3.eth.defaultAccount, gas: 250000}, async function (err, result) {
                if (err)
                    process.nextTick(function () {
                        reject(err);
                    });
                else {
                    console.log(sp_result.sp_user_address + "의 판매 hash 블록체인망에 업로드 완료! txHash: " + result);
                    await giveTokens(NaraMalsamiTokenInstance, sp_result.sp_server_hash);
                    await commitSPModel(database, sp_result.sp_id);
                    resolve(true);
                }
            })
        })
    });
}

function emitVerification(database, vp_data) {
    return new Promise(async function (resolve, reject) {
        const trade_contract_address = await getTradeContractAddress(database, vp_data.vp_trade_id);
        const NaraMalsamiTokenInstance = web3.eth.Contract(NMT_TRADE_ABI, trade_contract_address);
        NaraMalsamiTokenInstance.methods.emitVerifier(
            vp_data.vp_server_hash, vp_data.vp_data.length, Math.round(vp_data.vp_accuracy * 10000), vp_data.vp_user_address
        ).send({from: web3.eth.defaultAccount, gas: 250000}, async function (err, result) {
            if (err)
                process.nextTick(function () {
                    reject(err);
                });
            else {
                console.log(vp_data.vp_user_address + "의 검증 hash 블록체인망에 업로드 완료! txHash: " + result);
                await giveTokens(NaraMalsamiTokenInstance, vp_data.vp_server_hash);
                await commitVPModel(database, vp_data.vp_id);
            }
        })
    })
}

module.exports.emitVerification = emitVerification;
module.exports.emitSaleData = emitSaleData;