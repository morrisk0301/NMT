const imageDataURI = require('image-data-uri');
const web3_custom = require('./web3_custom');
const essential_info = require('../utils/essential_info');

function finishVD(database, vd_id) {
    return new Promise(function (resolve, reject) {
        database.VerificationDataModel.findOne({
            'vd_id': vd_id
        }, function (err, result) {
            result.vd_status = 'done';
            result.save(function (err) {
                resolve(true);
            })
        })
    })
}

function updateVPData(database, vd_data, vp_data) {
    return new Promise(function (resolve, reject) {
        vp_data.reduce(function (total, item) {
            return total.then(function () {
                let is_true = 0;
                for (let i = 0; i < item.vp_data.length; i++) {
                    const data_true = vd_data[i].accuracy >= 0.5;
                    item.vp_data[i].majority_answer = data_true;
                    if (data_true === item.vp_data[i].is_correct)
                        is_true++;
                }
                item.vp_accuracy = is_true / item.vp_data.length;
                item.markModified('vp_data');
                item.markModified('vp_accuracy');
                item.save(async function (err, save_result) {
                    await web3_custom.emitVerification(database, save_result);
                })
            })
        }, Promise.resolve()).then(function () {
            resolve(true);
        })
    });
}

function updateVP(database, vd_result) {
    return new Promise(function (resolve, reject) {
        const vd_data = vd_result.vd_data;
        database.VerificationParticipantModel.find({
            'vp_vd_id': vd_result.vd_id,
            'vp_is_finished': true,
            'vp_is_committed': false
        }, async function (err, vp_results) {
            await updateVPData(database, vd_data, vp_results);
            resolve(true);
        })
    })
}

function checkFinishedVD(database, vd_result) {
    return new Promise(function (resolve, reject) {
        let total_finished = true;
        vd_result.vd_data.reduce(function (total, item, counter) {
            return total.then(function () {
                if (!item.is_finished)
                    total_finished = false;
            });
        }, Promise.resolve()).then(async function () {
            if (!total_finished)
                process.nextTick(function () {
                    resolve(true);
                });
            else {
                const accuracy = Math.round(vd_result.vd_accuracy * 10000);
                await web3_custom.emitSaleData(database, vd_result.vd_sp_id, vd_result.vd_data.length, accuracy);
                await updateVP(database, vd_result);
                await finishVD(database, vd_result.vd_id);
                resolve(true);
            }
        });
    })
}

function calcAccuracy(user_verification) {
    return new Promise(function (resolve, reject) {
        let is_true = 0;
        user_verification.reduce(function (total, item, counter) {
            return total.then(async function () {
                if (item.is_correct)
                    is_true++;
            });
        }, Promise.resolve()).then(function () {
            resolve(is_true / user_verification.length);
        });
    })
}

function pushVD(vd_ori, vp_ori) {
    return new Promise(function (resolve, reject) {
        let vd_data = [];
        let sum = 0;
        const data_num = vd_ori.vd_data.length;

        vd_ori.vd_data.reduce(function (total, item, counter) {
            return total.then(async function () {
                const user_verification_data = {
                    vp_id: vp_ori.vp_id,
                    is_correct: vp_ori.vp_data[counter].is_correct
                };
                item.user_verification = item.user_verification.concat(user_verification_data);
                item.is_finished = item.user_verification.length === essential_info.DATA_VERIFIER_NUM;
                const accuracy = await calcAccuracy(item.user_verification);
                item.accuracy = accuracy;
                sum += accuracy;

                vd_data.push(item);
            });
        }, Promise.resolve()).then(function () {
            resolve({vd_data: vd_data, accuracy: sum / data_num});
        });
    })
}

function emitVD(database, vp_data) {
    return new Promise(function (resolve, reject) {
        database.VerificationDataModel.findOne({
            'vd_id': vp_data.vp_vd_id
        }, async function (err, result) {
            const push_data = await pushVD(result, vp_data);
            result.vd_data = push_data.vd_data;
            result.vd_accuracy = push_data.accuracy;
            result.markModified('vd_data');
            result.markModified('vd_accuracy');
            result.save(function (err, save_result) {
                process.nextTick(async function () {
                    await checkFinishedVD(database, save_result);
                });
                resolve(true);
            });
        })
    })
}

function searchOldestData(database, major) {
    return new Promise(function (resolve, reject) {
        database.VerificationDataModel.findOneAndUpdate({
            'vd_status': 'running',
            'vd_major_big': major.va_major_big,
            'vd_major_small': major.va_major_small,
        }, {$inc: {'vd_counter': 1}}).sort({created_at: 'ascending'}).exec(function (err, result) {
            if (err)
                process.nextTick(function () {
                    reject(err);
                });
            if (!result)
                resolve(null);
            else if (result.vd_counter + 1 === essential_info.DATA_VERIFIER_NUM) {
                result.vd_status = 'pending';
                result.save(function (err, save_result) {
                    resolve(save_result);
                })
            } else
                process.nextTick(function () {
                    resolve(result);
                });

        });

    })
}

function getMajor(database, user_id) {
    return new Promise(function (resolve, reject) {
        database.VerificationApplyModel.findOne({
            'va_user_id': user_id,
            'va_is_verified': true,
        }).select('va_major_big va_major_small').exec(function(err, result){
            resolve(result);
        })
    })
}

function searchDesignatedData(database, vd_id) {
    return new Promise(function (resolve, reject) {
        database.VerificationDataModel.findOne({
            'vd_id': vd_id
        }, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        })
    })
}

function encodeData(ori_data, start_idx) {
    return new Promise(function (resolve, reject) {
        let dataArray = [];
        for (let i = start_idx; i < ori_data.vd_data.length; i++) {
            const data = ori_data.vd_data[i].data.buffer;
            const data_type = ori_data.vd_data[i].data_type;
            dataArray.push({
                index: i,
                data: imageDataURI.encode(data, data_type)
            });
        }
        resolve(dataArray);
    })
}

function getNewVerificationImage(database, user_id) {
    return new Promise(async function (resolve, reject) {
        const major = await getMajor(database, user_id);
        const oldestData = await searchOldestData(database, major);

        if (oldestData) {
            const verificationData = await encodeData(oldestData, 0);
            database.SaleParticipantModel.findOne({
                'sp_id': oldestData.vd_sp_id
            }, function (err, result) {
                if (err)
                    reject(err);
                else {
                    const query = {
                        'trade_id': result.sp_trade_id,
                        'vd_id': oldestData.vd_id,
                        'data': verificationData
                    };
                    resolve(query);
                }
            })
        } else {
            process.nextTick(function () {
                const query = {
                    'trade_id': null,
                    'vd_id': null,
                    'data': null
                };
                resolve(query);
            })
        }
    });
}

function getOldVerificationImage(database, vd_id, index) {
    return new Promise(async function (resolve, reject) {
        const oldestData = await searchDesignatedData(database, vd_id);
        const verificationData = await encodeData(oldestData, index);
        const query = {
            'data': verificationData
        };
        resolve(query);
    });
}

function popVD(database, vd_id) {
    return new Promise(function (resolve, reject) {
        database.VerificationDataModel.findOne({
            'vd_id': vd_id
        }, function (err, result) {
            if (result.vd_status === 'pending')
                result.vd_status = 'running';
            result.vd_counter--;
            result.save(function (err) {
                resolve(true);
            })
        })
    })
}

function resetVerification(database) {
    return new Promise(function (resolve, reject) {
        database.VerificationParticipantModel.find({
            'vp_is_finished': false
        }, function (err, vp_results) {
            vp_results.reduce(function (total, item) {
                return total.then(async function () {
                    await popVD(database, item.vp_vd_id);
                    item.remove((function (err) {
                        if (err) throw err;
                    }))
                })
            }, Promise.resolve()).then(function () {
                console.log('검증 미완료 유저 초기화 완료!');
                resolve(true);
            })
        })
    })
}

module.exports.getNewVerificationImage = getNewVerificationImage;
module.exports.getOldVerificationImage = getOldVerificationImage;
module.exports.resetVerification = resetVerification;
module.exports.emitVD = emitVD;