const sharp = require('sharp');

function desizeImage(dataBuffer){
    return new Promise(function(resolve, reject){
        sharp(dataBuffer)
            .resize({
                height: 300,
                width: 300
            })
            .toBuffer()
            .then(resizeDataBuffer => {
                resolve(resizeDataBuffer);
            });
    });
}

module.exports.desizeImage = desizeImage;