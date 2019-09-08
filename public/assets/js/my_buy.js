const page = location.search.includes("page") ? location.search.split("page")[1][1] : 1;
const url_string = location.search.split("&page="+page)[0].replace("?", "");
const host = location.host;
let data;
let trade_id;

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

function closeLoadingWithMask() {
    $('#mask, #loadingImg, #loadingMessage').hide();
    $('#mask, #loadingImg, #loadingMessage').remove();
}

function LoadingWithMask(message) {
    const maskHeight = $(document).height();
    const maskWidth  = window.document.body.clientWidth;

    const mask       = "<div id='mask' style='position:absolute; z-index:9000; background-color:#000000; display:none; left:0; top:0;'></div>";
    const loadingImg = " <img src='assets/images/icon/Spinner.gif' id='loadingImg' style='position: fixed; top: 50%;left: 50%;margin-top: -50px;margin-left: -50px;'/>";
    const loadingMessage = "<h5 id='loadingMessage' style='color:#666; position: fixed; top: 70%;left: 50%;margin-top: -30px;margin-left: -50px;'>"+message+"</h5>";

    $('body').append(mask);
    $('body').append(loadingImg);
    $('body').append(loadingMessage);

    $('#mask').css({
        'width' : maskWidth,
        'height': maskHeight,
        'opacity' : '0.3'
    });

    $('#mask').show();
}

function downloadIPFS(sp_id, is_enc){
    return new Promise(async function (resolve, reject) {
        LoadingWithMask("IPFS망에서 데이터를 받는 중입니다.");
        const sale = await getOneSale(sp_id);
        const key = await getKey(user_id);
        const fileKey_buffer = node.types.Buffer.from(sale.sp_key, 'hex');
        const fileKey = await crypto.privateDecrypt(key.private_key, fileKey_buffer);
        const iv = node.types.Buffer.alloc(16, 0);
        const decipher = crypto.createDecipheriv('aes-256-cbc', fileKey, iv);
        getFileFromIPFS(sale.sp_file_hash, async function(encBuffer){
            console.log('ipfs에서 받기 완료');
            let zipBuffer;
            if(is_enc)
                zipBuffer = await node.types.Buffer(encBuffer);
            else
                zipBuffer = await node.types.Buffer.concat([decipher.update(encBuffer), decipher.final()]);

            saveByteArray(sale.sp_file_name, zipBuffer);
            closeLoadingWithMask();
            resolve(true);
        });
    })
}

function getKey(user_id) {
    return new Promise(function (resolve, reject) {
        fetch('http://' + host + '/key/' + user_id)
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

function getOneSale(sp_id) {
    return new Promise(function (resolve, reject) {
        fetch('http://' + host + '/sale/' + trade_id + '/' + sp_id)
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

function getFileFromIPFS(ipfsHash, callback) {
    node.cat(ipfsHash, function (err, data) {
        if(err || !data){
            console.log(err);
            getFileFromIPFS(ipfsHash, callback);
        }
        else
            callback(data)
    });
}

function saveByteArray(reportName, byte) {
    const blob = new Blob([byte], {type: "application/zip"});
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = reportName;
    link.click();
}



function getSale(trade_id) {
    return new Promise(function (resolve, reject) {
        fetch('http://' + host + '/sale/' + trade_id)
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    });
}


function dataRaised(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.dataRaised(function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        })
    })
}

function dataGoal(NMTT){
    return new Promise(function(resolve, reject){
        NMTT.dataGoal(function(err, result){
            if(err)
                reject(err);
            else
                resolve(result);
        })
    })
}

function setWeb3Data(trade, ABI){
    trade.forEach(async function(item){
        if(item.trade_user_id !== user_id)
            return;

        const NMTT = web3.eth.contract(ABI).at(item.trade_contract_address);
        const nmtt_dataRaised = await dataRaised(NMTT);
        const nmtt_dataGoal = await dataGoal(NMTT);
        const progress = Math.round((nmtt_dataRaised/nmtt_dataGoal)*100);

        $("#PGS"+item.trade_id).css('width', progress+'%');
        $("#TOOL"+item.trade_id).tooltip({title: nmtt_dataRaised + ' / ' + nmtt_dataGoal});
    })
}


window.onload = async function () {
    const trade = await getTrade();
    const ABI = await getTradeABI();
    $('#page-selection').bootpag({
        total: Math.ceil(parseInt(page_num)/15),
        page: page
    }).on("page", function(event, num){
        window.location = "/my_buy?"+url_string+"&page="+num.toString();
    });
    setWeb3Data(trade, ABI);
};

$(".flat").on("ifClicked", async function(event){
    trade_id = this.id;
    $("#tbody_sale").empty();
    $("#detail").empty();
    data = await getSale(this.id);

    data.sale.forEach(function(item){
        const vd_result = data.vd_data.find(vd_item => vd_item.sp_id === item.sp_id);
        const user_result = data.user_data.find(user_item => user_item.sp_id === item.sp_id);
        const rawDate = new Date(item.created_at);
        const is_verified = vd_result.vd_status === "done";

        if(is_verified){
            $("#tbody_sale").append('<tr>' +
                '<td>'+user_result.user_email+'</td>' +
                '<td><span class="status-p bg-success">검증 완료 </span></td>' +
                '<td>'+Math.round(vd_result.vd_accuracy*100)+'%</td>' +
                '<td><button id="DTL'+item.sp_id+'" class="btn btn-primary">내용 보기</button></td>' +
                '<td><button id="DDT'+item.sp_id+'" class="btn btn-primary">의견 보기</button></td>' +
                '<td><button id="DWL'+item.sp_id+'" class="btn btn-primary">다운로드</button></td>' +
                '<td><button id="DLE'+item.sp_id+'" class="btn btn-primary">다운로드</button></td>' +
                '<td>'+(rawDate.getMonth()+1) +" / " + rawDate.getDate() + " / " + rawDate.getFullYear()+'</td></tr>')
        }
        else {
            $("#tbody_sale").append('<tr>' +
                '<td>'+user_result.user_email+'</td>' +
                '<td><span class="status-p bg-warning">검증 진행중 </span></td>' +
                '<td>산정중</td>' +
                '<td><button id="DTL'+item.sp_id+'" class="btn btn-primary">내용 보기</button></td>' +
                '<td><button class="btn btn-warning">검증 진행중</button></td>' +
                '<td><button class="btn btn-warning">검증 진행중</button></td>' +
                '<td><button class="btn btn-warning">검증 진행중</button></td>' +
                '<td>'+(rawDate.getMonth()+1) +" / " + rawDate.getDate() + " / " + rawDate.getFullYear()+'</td></tr>')
        }
    })

});

$("#tbody_sale").on("click", "button", async function(){
    if(this.id.includes("DTL")){
        $("#detail").empty();
        const id = parseInt(this.id.split('DTL')[1]);
        const sale_result = data.sale.find(sale_item => sale_item.sp_id === id);
        $("#detail").append('<h4>판매 내용 </h4><br><div class="form-control">'+ sale_result.sp_detail+'</div>');
    }
    else if(this.id.includes("DWL")){
        const id = parseInt(this.id.split('DWL')[1]);
        await downloadIPFS(id);
    } else if(this.id.includes("DLE")){
        const id = parseInt(this.id.split('DLE')[1]);
        await downloadIPFS(id, true);
    } else if(this.id.includes("DDT")){
        const id = parseInt(this.id.split('DDT')[1]);
        window.open("/verification_detail?sp_id="+id, "검증 의견", "width=500,height=600");
        //const sale_result = data.sale.find(sale_item => sale_item.sp_id === id);
    }
});


