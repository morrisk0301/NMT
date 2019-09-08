const page = location.search.includes("page") ? location.search.split("page")[1][1] : 1;
const url_string = location.search.split("&page="+page)[0].replace("?", "");
const host = location.host;
let id;

function getVerifier(id){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/verifier/'+id)
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
    })
}

window.onload = async function () {
    $('#page-selection').bootpag({
        total: Math.ceil(parseInt(page_num)/5),
        page: page
    }).on("page", function(event, num){
        window.location = "/auth_verifier?"+url_string+"&page="+num.toString();
    });
};


$(".flat").on("ifClicked", async function(event){
    id = this.id;

    const va_data = await getVerifier(id);
    $("#name").text(va_data.va_name);
    $("#phone").text(va_data.va_phone);
    $("#major").text('대분류: '+va_data.va_major_big + ' / 소분류: '+va_data.va_major_small);
    $("#academic").text(va_data.va_academic);
    $("#year").text(va_data.va_year);
    $("#academic_div").append('<br><img src="'+va_data.va_academic_img+'"/>');
    $("#year_div").append('<br><img src="'+va_data.va_year_img+'"/>');
    if(!va_data.va_is_verified){
        $("#submit_button").attr('hidden', false);
    }
});

$("#submit_button").on("click", function(event){
    $.ajax({
        url: '/verifier/' + id,
        type: 'PUT',
        success: function (data) {
            if(data) {
                alert("승인 완료되었습니다");
                window.location.reload();
            }
        }
    });
});