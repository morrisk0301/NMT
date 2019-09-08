let account;

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
    account = await getAccount();
    if(!account){
        alert("메타마스크 로그인 상태를 확인해 주세요");
        window.location="/verify_warning";
    }
    if(length===0){
        alert("검증 가능한 데이터가 없습니다.");
        window.location="/verify_warning";
    }
};


$("#btn_submit_verification").on("click", function(event){
    if(!account){
        alert("메타마스크 로그인 상태를 확인해 주세요");
        window.location="/verify_warning";
        return false;
    }
    let query = [];
    $('.verifycheckbox').each(function (index, obj) {
        query.push({
            index: parseInt(this.id),
            is_correct: this.checked
        })
    });

    $.ajax({
        url: '/verification/image/'+vp_id,
        type: 'PUT',
        data: {data: JSON.stringify(query)},
        success: function (data) {
            if(data.put_verification)
                window.location.reload();
            else{
                alert("데이터 검증에 실패하였습니다.");
                return false;
            }
        }
    });
    return false;
});

$("#btn_submit_verification_final").on("click", function(event){
    if(!web3.eth.defaultAccount){
        alert("메타마스크 로그인 상태를 확인해 주세요");
        window.location="/verify_warning";
        return false;
    }
    if($("#verification_detail").val()===""){
        alert("검증 의견을 입력해 주세요");
        return false;
    }
    let query = [];
    $('.verifycheckbox').each(function (index, obj) {
        query.push({
            index: parseInt(this.id),
            is_correct: this.checked
        })
    });

    $.ajax({
        url: '/verification/image/'+vp_id,
        type: 'PUT',
        data: {
            data: JSON.stringify(query),
            detail: $("#verification_detail").val()
        },
        success: function (data) {
            if(data.put_verification)
                window.location = '/verify_done';
            else{
                alert("데이터 검증에 실패하였습니다.");
                return false;
            }
        }
    });
    return false;
});

$(".image-checkbox").each(function () {
    if ($(this).find('input[type="checkbox"]').first().attr("checked")) {
        $(this).addClass('image-checkbox-checked');
    }
    else {
        $(this).removeClass('image-checkbox-checked');
    }
});

// sync the state to the input
$(".image-checkbox").on("click", function (e) {
    $(this).toggleClass('image-checkbox-checked');
    const $checkbox = $(this).find('input[type="checkbox"]');
    $checkbox.prop("checked",!$checkbox.prop("checked"))

    e.preventDefault();
});