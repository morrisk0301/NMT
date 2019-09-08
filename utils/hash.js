const crypto = require('crypto');

function generateHash(hashLength){
    return new Promise(function(resolve, reject){
        crypto.randomBytes(hashLength, function(err, buf) {
            if(err)
                reject(err);
            const hash = buf.toString('hex');
            resolve(hash);
        });
    })
}

function generateKeyPair(){
    return new Promise(function(resolve, reject){
        crypto.generateKeyPair('rsa', {
            modulusLength: 1024,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        }, (err, publicKey, privateKey) => {
            resolve({
                publicKey: publicKey,
                privateKey: privateKey
            })
        });
    })
}

module.exports.generateHash = generateHash;
module.exports.generateKeyPair = generateKeyPair;