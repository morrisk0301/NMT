let fileBuffer;
let fileName;
let publicKey;
let fileKey;
let isSubmit = false;
const host = location.host;
const crypto = require('crypto');
//const node = window.IpfsApi('ipfs.infura.io', '5001', {protocol: 'https'});
const node = window.IpfsApi('13.125.53.194', '5001');

window.onload = async function () {
    const key = await getKey(trade_user_id);
    publicKey = key.public_key;
};

function getAccount(){
    return new Promise(function(resolve, reject){
        web3.eth.getAccounts(function(err, accounts){
            if(err)
                reject(err);
            else
                resolve(accounts[0]);
        })
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

function loadFile(file){
    return new Promise(function(resolve, reject){
        var fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function(e){
            const result = e.target.result;
            resolve(result);
        };
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

$("#file_input").on('change', async function(event){
    LoadingWithMask("파일을 업로드 중입니다.");
    const file_buffer = await loadFile(this.files[0]);
    isSubmit = true;
    fileName = this.files[0].name;
    console.log(file_buffer);

    $("#file_label").text(fileName);
    fileKey = await crypto.randomBytes(32);
    const iv = node.types.Buffer.alloc(16, 0);
    const cipher = await crypto.createCipheriv('aes-256-cbc', fileKey, iv);
    fileBuffer = await node.types.Buffer.concat([cipher.update(node.types.Buffer.from(file_buffer)), cipher.final()]);
    console.log(typeof(fileBuffer));
    closeLoadingWithMask();
});

$("#sell_submit").on('click', async function(event){
    if(!isSubmit){
        alert("파일을 업로드 해주세요");
        return false;
    }
    else if($("#sp_detail").val()===""){
        alert("판매 내용을 입력해 주세요");
        return false;
    }

    const account = await getAccount();
    if(!account){
        alert("메타마스크 로그인 상태를 확인해 주세요");
        return false;
    }

    LoadingWithMask("IPFS망으로 파일을 업로드 중입니다.");

    console.log('upload clicked');
    console.log('uploading file to IPFs');

    const filesAdded = await node.add(fileBuffer);
    const encrypt_key = await crypto.publicEncrypt(publicKey, fileKey);

    console.log('Added file:', filesAdded[0].path, filesAdded[0].hash);

    const fileHash = filesAdded[0].hash;

    const sp_detail = $("#sp_detail").val();
    const query = {sp_trade_id: trade_id, sp_detail: sp_detail, sp_user_address: account,
        sp_file_name: fileName, file_hash: fileHash, sp_key: encrypt_key.toString('hex')};

    $.post("/sale", query, function(data, status){
        if(data.post_trade){
            window.location="/sell_done";
        } else{
            alert("구매 등록에 실패하였습니다");
            closeLoadingWithMask();
            return false;
        }
    })
    return false;

});
