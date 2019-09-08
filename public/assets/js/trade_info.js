const host = location.host;

function getTrade() {
    return new Promise(function (resolve, reject) {
        fetch('http://' + host + '/trade/' + trade_id)
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

function getTradeABI(){
    return new Promise(function (resolve, reject) {
        fetch('http://' + host + '/nmt_trade_abi/')
            .then((res) => res.json())
            .then((data) => {
                resolve(data.NMT_TRADE_ABI);
            })
    })
}


function getweiPerData(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.weiPerData(function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        })
    })
}

function getDataGoal(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.dataGoal(function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        })
    })
}

async function setValue(trade) {
    const ABI = await getTradeABI();
    const NMTT = web3.eth.contract(ABI).at(trade.trade_contract_address);
    const weiPerData = await getweiPerData(NMTT)
    const dataGoal = await getDataGoal(NMTT);

    $("#dataGoal").text(dataGoal+'개');
    $("#weiPerData").text(web3.fromWei(weiPerData, 'ether')+'NMT');
}

window.onload = async function () {
    const trade = await getTrade();
    setValue(trade).then(() => {});
}