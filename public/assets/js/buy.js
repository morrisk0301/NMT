let image_str;
let categoryV;
let address_token;
let ABI;
let NaraMalsamiToken;
let eventTrade;
let post = -1;
const host = location.host;

function getCategoryV(){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/verification_category')
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

async function setTokenInfo(){
    address_token = await getTokenAddress();
    ABI = await getTokenABI();
    NaraMalsamiToken = web3.eth.contract(ABI).at(address_token);
    eventTrade = NaraMalsamiToken.tradeMade();
    console.log('set token done');
}

function getTokenAddress(){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/nmt_address')
            .then((res) => res.json())
            .then((data) => {
                resolve(data.NMT_ADDRESS);
            })
    })
}

function getTokenABI(){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/nmt_abi')
            .then((res) => res.json())
            .then((data) => {
                resolve(data.NMT_ABI);
            })
    })
}

function getCategory(){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/category')
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

function waitForAddress(user_address, callback) {
    eventTrade.watch(function(err, res){
        if(err)
            console.log(err);
        if(!res || res.args.maker !== user_address){
            waitForAddress(user_address, callback);
        }
        else if(res.args.maker === user_address){
            post++;
            callback(res.args.tradeAddress);
        }

    })
}


function loadFile(file){
    return new Promise(function(resolve, reject){
        var fileReader = new FileReader();
        fileReader.readAsDataURL(file);
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

window.onload = async function () {
    setTokenInfo().then(() => Promise.resolve());
    const category = await getCategory();
    categoryV = await getCategoryV();
    categoryV.major_big.forEach(function(item){
        $("#major_big").append($('<option>', {
            text: item
        }));
    });
    category.forEach(function(item){
        $("#trade_category").append($('<option>', {
            text: item
        }));
    });
};


$("#major_big").on('change', function(event){
    $("#major_small").empty();
    $("#major_small").append($('<option>', {
        text: "소분류를 선택해주세요"
    }));
    if($("#major_big").val() ==="인문계열"){
        categoryV.major_small.major_1.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="교육계열"){
        categoryV.major_small.major_2.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="사회계열"){
        categoryV.major_small.major_3.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="자연계열"){
        categoryV.major_small.major_4.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="공학계열"){
        categoryV.major_small.major_5.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="의약계열"){
        categoryV.major_small.major_6.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="예ㆍ체능계열"){
        categoryV.major_small.major_7.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    }
});

$("#img_input").on('change', function(event){
    var files = this.files;
    var file = [];
    const name = this.files.length <=1 ? this.files[0].name : (this.files[0].name + " 외 "+ (this.files.length-1).toString() + "개");

    Object.keys(files).reduce(function(total, index) {
        return loadFile(files[index]).then(function(dataUri) {
            file.push(dataUri);
        });
    }, Promise.resolve()).then(function() {
        image_str = JSON.stringify(file);
        $("#file_label").text(name);
    });
});


$("#submit_button").on('click', async function(event){
    let cap = web3.toWei($("#cap").val(), 'ether');
    let dataGoal = $("#dataGoal").val();
/*
    NaraMalsamiToken.setServer("0x7e665754cCaAfC3893B5d1c635CBcf4cfB636971", {gas: 900000}, function(err, result){
        console.log(err, result);
    });


*/


/*
    NaraMalsamiToken.addWhitelisted("0x0DDc99561a68fE767E631bE507C765Ad55090896", {gas: 90000}, function(err, result){
        console.log(err, result);
    });

 */


    if($("#trade_category").val() === "카테고리를 선택해 주세요"){
        alert("카테고리를 올바르게 선택해 주세요");
        return false;
    }
    if($("#major_big").val() === "대분류를 선택해주세요"){
        alert("전공 대분류를 올바르게 선택해주세요");
        return false;
    }
    if($("#major_small").val() === "소분류를 선택해주세요"){
        alert("전공 소분류를 올바르게 선택해주세요");
        return false;
    }

    const account = await getAccount();

    if(!account){
        alert("메타마스크 로그인 상태를 확인해 주세요");
        return false;
    }

    if($("#trade_head").val() === "" ||
        $("#trade_body").val() === "" ||
        $("#trade_verification_command").val() === "" ||
        $("#cap").val() === "" ||
        $("#dataGoal").val() === "")
    {
        alert("필수 입력 필드를 입력해 주세요");
        return false;
    }

    LoadingWithMask("신규 블록체인 거래를 생성중입니다.");

    NaraMalsamiToken.newTrade(cap, dataGoal, 20, {
        gas: 2500000
    }, function(err, result){
        if(err){
            console.log(err);
            closeLoadingWithMask();
            return false;
        }
        waitForAddress(account, function(address){
            let query = {trade_img: image_str, trade_contract_address: address, major_big: $("#major_big").val(), major_small:$("#major_small").val()};
            if($("#trade_head").val()!=='') query.trade_head = $('#trade_head').val();
            if($("#trade_body").val()!=='') query.trade_body = $('#trade_body').val();
            if($("#trade_category").val()!=='') query.trade_category = $('#trade_category').val();
            if($("#trade_verification_command").val()!=='') query.trade_verification_command = $('#trade_verification_command').val();

            if(post === 0) {
                $.post("/trade", query, function (data, status) {
                    if (data.post_trade) {
                        window.location = '/buy_done';
                    } else {
                        alert("구매 등록에 실패하였습니다");
                        return false;
                    }
                });
                return false;
            }
            return false;
        });

    });

});

$("#sample_button").on("click", function(event){
    $("#trade_head").val("개 사진 구매합니다.");
    $("#trade_body").val("개 사진 구매합니다. 최소 500*500 픽셀이어야 합니다. \n개 사진 이외에 다른 사물이 들어가서는 안됩니다." +
        "개 종류는 상관 없습니다. 데이터는 중복되지 않아야 합니다.");
    $("#trade_category").val("동물");
    $("#trade_verification_command").val("다음 중 개 사진은?(중복되는 사진은 선택x)");
    $("#major_big").val("자연계열");
    $("#major_small").append("<option selected>동물ㆍ수의학</option");
    $("#cap").val(10000);
    $("#dataGoal").val(100);
});