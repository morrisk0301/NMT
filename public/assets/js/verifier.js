let img_academic;
let img_year;
const host = location.host;
let category;


function getCategory(){
    return new Promise(function(resolve, reject){
        fetch('http://'+host+'/verification_category')
            .then((res) => res.json())
            .then((data) => {
                resolve(data);
            })
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


window.onload = async function () {
    category = await getCategory();
    category.major_big.forEach(function(item){
        $("#major_big").append($('<option>', {
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
        category.major_small.major_1.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="교육계열"){
        category.major_small.major_2.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="사회계열"){
        category.major_small.major_3.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="자연계열"){
        category.major_small.major_4.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="공학계열"){
        category.major_small.major_5.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="의약계열"){
        category.major_small.major_6.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    } else if($("#major_big").val() ==="예ㆍ체능계열"){
        category.major_small.major_7.forEach(function(item){
            $("#major_small").append($('<option>', {
                text: item
            }));
        })
    }
});

$("#academic_img").on('change', async function(event){
    img_academic = await loadFile(this.files[0]);
    $("#academic_label").text(this.files[0].name);
});

$("#year_img").on('change', async function(event){
    img_year = await loadFile(this.files[0]);
    $("#year_label").text(this.files[0].name);
});


$("#submit_button").on('click', async function(event){

    if($("#major_big").val() === "대분류를 선택해주세요"){
        alert("전공 대분류를 올바르게 선택해주세요");
        return false;
    }
    if($("#major_small").val() === "소분류를 선택해주세요"){
        alert("전공 소분류를 올바르게 선택해주세요");
        return false;
    }
    if($("#academic").val() === "최종 학력을 선택해주세요"){
        alert("최종 학력을 올바르게 선택해주세요");
        return false;
    }
    if($("#academic_label").text() === "학위 증명서를 업로드 해주세요"){
        alert("학위 증명서를 업로드 해주세요");
        return false;
    }
    if($("#year_label").text() === "경력 증명서를 업로드 해주세요"){
        alert("경력 증명서를 업로드 해주세요");
        return false;
    }


    if($("#name").text() === "" ||
        $("#phone").val() === "" ||
        $("#year").val() === "")
    {
        alert("필수 입력 필드를 입력해 주세요");
        return false;
    }

    const query = {
        'name': $("#name").text(),
        'phone': $("#phone").val(),
        'major_big': $("#major_big").val(),
        'major_small': $("#major_small").val(),
        'academic': $("#academic").val(),
        'academic_img': img_academic,
        'year_img': img_year,
        'year': $("#year").val(),
    };

    $.post("/verifier", query, function(data, status){
        if(data){
            alert('구매자 신청이 완료되었습니다!');
            window.location = '/';
        } else{
            alert("구매 등록에 실패하였습니다");
            return false;
        }
    });
});