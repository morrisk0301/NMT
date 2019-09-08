const crypto = require('crypto');
const fs = require('fs');
const AdmZip = require('adm-zip');
const fileType = require('file-type');
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI('13.125.53.194', '5001');
const convert_image = require('../utils/convert_image');

const uploadFileToIPFS = function (fileDetails, callback) {
    let fileContent = fs.readFileSync(fileDetails);
    ipfs.add(fileContent, (err, filesAdded) => {
        if (err) {
            return callback(err);
        }
        callback(null, {
            hash: filesAdded[0].hash
        });
    });
};

function getPrivateKey(database, trade_id) {
    return new Promise(function (resolve, reject) {
        database.TradeModel.findOne({
            'trade_id': trade_id
        }, function (err, trade_result) {
            database.UserKeyModel.findOne({
                'uk_user_id': trade_result.trade_user_id
            }, function (err, key_result) {
                resolve(key_result.uk_private_key);
            })
        })
    })
}


function getFileFromIPFS(ipfsHash, callback) {
    ipfs.cat(ipfsHash, function (err, data) {
        if(err || !data){
            console.log(err);
            getFileFromIPFS(ipfsHash, callback);
        }
        else
            callback(data)
    });
}

function bufferToZip(fileBuffer, name, callback) {
    fs.writeFile(name, fileBuffer, "binary", function (err) {
        if (err) {
            callback(err);
        } else {
            console.log("The file was saved!");
            callback(null);
        }
    });
}

function extractZipBuffer(zipBuffer) {
    return new Promise(function (resolve, reject) {
        let dataArray = [];
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();

        zipEntries.reduce(function (total, item, counter) {
            return total.then(async function () {
                //if (counter === 0)
                    //return;
                const zip_data = item.getData();
                const resize_data = await convert_image.desizeImage(zip_data);
                dataArray.push({
                    data: resize_data,
                    data_type: fileType(zip_data).mime,
                    user_verification: [],
                    accuracy: 0,
                    is_finished: false
                });
            });
        }, Promise.resolve()).then(function () {
            resolve(dataArray);
        });
    })
}

function getVerificationCategory(database, trade_id){
    return new Promise(function(resolve, reject){
        database.TradeModel.findOne({
            'trade_id': trade_id,
        }).select('trade_major_big trade_major_small').exec(function(err, result){
            resolve(result);
        })
    })
}


async function storeFileFromHash(ipfsHash, sp_data, database) {
    const iv = Buffer.alloc(16, 0);
    const privateKey = await getPrivateKey(database, sp_data.sp_trade_id);
    const fileKey_buffer = Buffer.from(sp_data.sp_key, 'hex');
    const fileKey = await crypto.privateDecrypt(privateKey, fileKey_buffer);
    const decipher = crypto.createDecipheriv('aes-256-cbc', fileKey, iv);
    getFileFromIPFS(ipfsHash, async function(encBuffer){
        const zipBuffer = await Buffer.concat([decipher.update(encBuffer), decipher.final()]);
        const dataArray = await extractZipBuffer(zipBuffer);
        const VerrificationCategory = await getVerificationCategory(database, sp_data.sp_trade_id);

        const newVD = new database.VerificationDataModel({
            'vd_sp_id': sp_data.sp_id,
            'vd_data': dataArray,
            'vd_major_big': VerrificationCategory.trade_major_big,
            'vd_major_small': VerrificationCategory.trade_major_small,
        });

        newVD.save(function (err) {
            if (err)
                throw err;
            console.log('판매번호', sp_data.sp_id, 'ipfs 에서 데이터 받기 완료!');
        })
    });
}


module.exports.storeFileFromHash = storeFileFromHash;


