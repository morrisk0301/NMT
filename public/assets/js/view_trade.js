const page = location.search.includes("page") ? location.search.split("page")[1][1] : 1;
const url_string = location.search.split("&page="+page)[0].replace("?", "");
const host = location.host;

function getTrade() {
    return new Promise(function (resolve, reject) {
        fetch('http://' + host + '/trade')
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

function getTradeABI(){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/nmt_trade_abi')
            .then((res) => res.json())
            .then((data) => {
                resolve(data.NMT_TRADE_ABI);
            })
    })
}

function weiPerData(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.weiPerData(function(err, result){
            if(err)
                reject(err)
            else
                resolve(result);
        })
    })
}

function dataRaised(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.dataRaised(function(err, result){
            if(err)
                reject(err)
            else
                resolve(result);
        })
    })
}

function dataGoal(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.dataGoal(function(err, result){
            if(err)
                reject(err)
            else
                resolve(result);
        })
    })
}

function setWeb3Data(trade, ABI){
    trade.forEach(async function(item){
        const NMTT = web3.eth.contract(ABI).at(item.trade_contract_address);
        const nmtt_weiPerData = await weiPerData(NMTT);
        const nmtt_dataRaised = await dataRaised(NMTT);
        const nmtt_dataGoal = await dataGoal(NMTT);
        const progress = Math.round((nmtt_dataRaised/nmtt_dataGoal)*100);

        let status;
        if(progress < 50)
            status = 'bg-primary';
        else if(progress < 100)
            status = 'bg-warning';
        else
            status = 'bg-success';

        $("#NMT"+item.trade_id).text(web3.fromWei(nmtt_weiPerData, 'ether'));
        $("#PGS"+item.trade_id).css('width', progress+'%');
        $("#PGS"+item.trade_id).addClass(status);
        $("#DTR"+item.trade_id).text(nmtt_dataRaised);
        $("#DTG"+item.trade_id).text(nmtt_dataGoal);
    })
}

window.onload = async function () {
    const trade = await getTrade();
    const ABI = await getTradeABI();
    $('#page-selection').bootpag({
        total: Math.ceil(parseInt(page_num)/6),
        page: page
    }).on("page", function(event, num){
        window.location = "/view_trade?"+url_string+"&page="+num.toString();
    });
    setWeb3Data(trade, ABI);
};