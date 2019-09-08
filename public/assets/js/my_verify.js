const page = location.search.includes("page") ? location.search.split("page")[1][1] : 1;
const url_string = location.search.split("&page="+page)[0].replace("?", "");
const host = location.host;

window.onload = async function () {
    $('#page-selection').bootpag({
        total: Math.ceil(parseInt(page_num)/15),
        page: page
    }).on("page", function(event, num){
        window.location = "/my_verify?"+url_string+"&page="+num.toString();
    });
};


