const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI('13.125.53.194', '5001');

ipfsHash = "QmZBYJR1JEtatYN7DVtP2fkkfhKTV27fRwZCzq59yZDPDV";

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
getFileFromIPFS(ipfsHash, function(data){
    console.log(data);
})
