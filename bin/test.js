const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const ABI = require("../../NMT/build/contracts/NaraMalsamiToken.json").abi;
const crowdABI = require("../../NMT/build/contracts/NaraMalsamiTokenCrowdsale.json").abi;
const tradeABI = require("../../NMT/build/contracts/NaraMalsamiTokenTrade.json").abi;
const byteCode = require("../../NMT/build/contracts/NaraMalsamiTokenTrade.json").bytecode;
const crowdAddress = "0xB24d63ADf01B382EfE6e52B5FE7923A03403813D";


/////////////////////////////////////TestNet////////////////////////////////////////
const web3 = new Web3(new HDWalletProvider("hat noodle vendor spider during night amateur good opera paper wait arena",
    "https://kovan.infura.io/v3/7bdfe4d2582141ef8e00c2cf929c72ee"));
const tokenAddress = "0x91555A505dE5F03Fb72c9efAB6dA24eaed1C9647";

web3.eth.defaultAccount = "0x0E32E68a20928826c5C805aB8b0509cAe3A90517";

let NaraMalsamiToken = web3.eth.contract(ABI).at(tokenAddress);
let NaraMalsamiTokenTrade = web3.eth.contract(tradeABI);
////////////////////////////////////////////////////////////////////////////////


/*/////////////////////////////////////local////////////////////////////////////////

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
const tokenAddress = "0x2289f1283570d918D27C100c41743f004C260AF9";

web3.eth.defaultAccount = web3.eth.accounts[0];

let NaraMalsamiToken = web3.eth.contract(ABI).at(tokenAddress_local);
let NaraMalsamiTokenTrade = web3.eth.contract(tradeABI);

////////////////////////////////////////////////////////////////////////////////*/

let NaraMalsamiTokenCrowdsale = web3.eth.contract(crowdABI).at(crowdAddress);
const cap = web3.toWei('1', 'ether');
const weiPerData = web3.toWei('0.01', 'ether');
const dataGoal = 10000;


function newContract () {
    return new Promise(function(resolve, reject){
        NaraMalsamiTokenTrade.new(tokenAddress, cap, weiPerData, dataGoal, {
            from: web3.eth.defaultAccount,
            data: byteCode
        }, function (err, myContract) {
            if(err) console.log(err);
            if (!err) {
                // NOTE: The callback will fire twice!
                // Once the contract has the transactionHash property set and once its deployed on an address.
                // e.g. check tx hash on the first call (transaction send)
                if (!myContract.address) {
                    console.log(myContract.transactionHash) // The hash of the transaction, which deploys the contract

                    // check address on the second call (contract deployed)
                } else {
                    console.log(myContract.address); // the contract address
                    NaraMalsamiToken.transfer(myContract.address, cap, function (err, result) {
                        //Transfer token for purchasing data
                        resolve(myContract);
                    })
                }
                // Note that the returned "myContractReturned" === "myContract",
                // so the returned "myContractReturned" object will also get the address set.
            }
        })
    });
}

function waitForReceipt(hash, callback) {
    web3.eth.getTransactionReceipt(hash, function (err, receipt) {
        if (err) {
            error(err);
        }

        if (receipt !== null) {
            // Transaction went through
            if (callback) {
                callback(receipt);
            }
        } else {
            // Try again in 1 second
            setTimeout(function () {
                waitForReceipt(hash, callback);
            }, 1000);
        }
    });
}

function getDataIndex(NaraMalsamiTokenTradeIns, blockNumber, callback){
    NaraMalsamiTokenTradeIns.dataEmitted(
        {beneficiary:web3.eth.defaultAccount}, {fromBlock: blockNumber, toBlock: blockNumber}
    ).get((err, eventResult) => {
        if (err)
            error(err);
        if (eventResult.length === 0){
            setTimeout(function () {
                getDataIndex(NaraMalsamiTokenTradeIns, blockNumber, callback);
            }, 1000);
        }
        else{
            const dataIndex = eventResult[0].args.dataBlockCounter.toNumber();
            callback(dataIndex);
        }
    });
}

function txHashToDataIndex(NaraMalsamiTokenTradeIns, txHash, callback){
    //Server Function
    waitForReceipt(txHash, function(receipt){
        const blockNumber = receipt.blockNumber;
        getDataIndex(NaraMalsamiTokenTradeIns, blockNumber, function(dataIndex){
            console.log(blockNumber, dataIndex);
            callback(dataIndex);
        })
    });
}

function emitAccuracy(NaraMalsamiTokenTradeIns, blockNumber, callback){
    NaraMalsamiTokenTradeIns.emitAccuracy(blockNumber, 30, function(err, txHash) {
        if(err)
            callback(err);
        else
            callback(null, txHash);
    })
}

function emitData(NaraMalsamiTokenTradeIns, fileHash, numOfData, callback){
    NaraMalsamiTokenTradeIns.emitData(fileHash, numOfData, {gas:160000},function(err, txHash) {
        if(err) callback(err);
        txHashToDataIndex(NaraMalsamiTokenTradeIns, txHash, function (dataIndex) {
            callback(null, dataIndex);
        })
    })
}

function getData(NaraMalsamiTokenTradeIns, blockNumber, callback){
    NaraMalsamiTokenTradeIns.getData(blockNumber, 30, function(err, dataResult) {
        if(err)
            callback(err);
        else
            callback(null, dataResult);
    })
}

function claimTokens(NaraMalsamiTokenTradeIns, blockNumber, callback){
    //For Data Seller
    //Claim token after server submits accuracy
    NaraMalsamiTokenTradeIns.claimTokens(blockNumber, function(err, txHash) {
        if(err)
            callback(err);
        else
            callback(null, txHash);
    })
}

function claimRefund(NaraMalsamiTokenTradeIns, callback){
    //For Data Purchaser
    //Terminate trade and claim refund of paid token
    //Functino calculates refundable tokens(tokens unclaimed by user will be excluded)
    NaraMalsamiTokenTradeIns.claimRefund(function(err, txHash) {
        if(err)
            callback(err);
        else
            callback(null, txHash);
    })
}

function refundToken(NaraMalsamiTokenTradeIns, callback) {
    //Process refund, transfer actual refundable token to data purchaser
    // claimRefund() -> refundToken()
    NaraMalsamiTokenTradeIns.refundToken(function(err, txHash) {
        if(err)
            callback(err);
        else
            callback(null, txHash);
    })
}


async function newTrade(){
    //const NaraMalsamiTokenTradeIns = await newContract();                                                       //New Deployment
    //const NaraMalsamiTokenTradeIns = NaraMalsamiTokenTrade.at("0x764761fb0e764ac065f7d380a218a309624dfaa2");    //Exisiting Contract
    const fileHash = "hellohello";
    const numofData = 10;

    emitData(NaraMalsamiTokenTradeIns, fileHash, numofData, function(err, dataindex){
        console.log(dataindex);
        emitAccuracy(NaraMalsamiTokenTradeIns, dataindex, function(err, result){
            console.log(err, result);
        })
    })
}

newTrade().then();
