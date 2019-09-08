const Web3 = require('web3');
const token_info = require('../utils/token_info');

const web3 = new Web3(new Web3.providers.HttpProvider("http://13.125.53.194:8545"));
//const web3 = new Web3(new Web3.providers.HttpProvider("http://172.31.20.184:8545"));

web3.eth.defaultAccount = token_info.SERVER_ADDREESS;

const NaraMalsamiToken = web3.eth.Contract(token_info.NMT_ABI, token_info.NMT_ADDRESS);

NaraMalsamiToken.methods.setServer("0x7e665754cCaAfC3893B5d1c635CBcf4cfB636971").send({from: web3.eth.defaultAccount, gas: 900000}, function(err, result){
    console.log(err, result);
});
