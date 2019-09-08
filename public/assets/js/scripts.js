
(function($) {
    "use strict";

    /*================================
    Preloader
    ==================================*/

    var preloader = $('#preloader');
    $(window).on('load', function() {
        preloader.fadeOut('slow', function() { $(this).remove(); });
        if ($("input.flat")[0]) {
            $(document).ready(function () {
                $('input.flat').iCheck({
                    checkboxClass: 'icheckbox_flat-pink',
                    radioClass: 'iradio_flat-pink'
                });
            });
        }
    });

    /*================================
    login module
    ==================================*/

    $("#btn_login").on("click", function(event){
        window.location = "/login";
    });

    $("#btn_logout").on("click", function(event){
        $.ajax({
            url: '/logout',
            type: 'GET',
            success: function (data) {
                window.location.reload();
            }
        });
    });

    $("#btn_submit_login").on("click", function(event){
        /*
        const query = {
            "email": $("#email").val(),
            "password": $("#password").val()
        }
        */
        const query = {
            "email": "kikim92@hanmail.net",
            "password": "123123"
        }

        $.ajax({
            url: '/login',
            type: 'POST',
            data: query,
            success: function (data) {
                if(data.err){
                    if(data.err === "이메일 미인증 에러")
                        $("#text_warning").text("이메일 인증을 완료해 주시기 바랍니다.");
                    else
                        $("#text_warning").text("가입 되어있지 않은 회원이거나, 비밀번호가 일치하지 않습니다.");
                    $("#email").val("");
                    $("#password").val("");
                }
                else if(data.login)
                    window.location = '/';
            }
        });
        return false;
    });

    $("#btn_submit_signup").on("click", function(event){
        const password = $("#password").val()
        if(password !== $("#password_confirm").val()){
            alert("비밀번호 확인 값이 일치하지 않습니다.")
            return false;
        }
        else if(password.length < 6){
            alert("비밀번호는 6자리 이상이어야 합니다.")
            return false;
        }
        const query = {
            "email": $("#email").val(),
            "password": $("#password").val(),
            "name": $("#name").val()
        }
        $.ajax({
            url: '/signup',
            type: 'POST',
            data: query,
            success: function (data) {
                if(data.err){
                    $("#text_warning").text("이미 가입되어 있는 회원입니다.");
                    $("#email").val("");
                    $("#password").val("");
                    $("#password_confirm").val("");
                    $("#name").val("");
                }
                else if(data.signup) {
                    alert("인증 메일이 전송되었습니다. 이메일 인증을 완료해 주세요.")
                    window.location = '/login';
                }
            }
        });
        return false;
    });

    $('#btn_submit_forgot').on('click', function(event){
        $.ajax({
            url: '/emailReset/'+$("#email").val(),
            type: 'GET',
            success: function (data) {
                if(data.err){
                    $("#text_warning").text("회원 가입되어 있지 않거나, 이메일 주소가 잘못되었습니다.");
                    $("#email").val("");
                }
                else if(data.forgot){
                    alert("인증 메일이 전송되었습니다. 이메일 인증을 완료해 주세요.");
                    window.location = '/login';
                }
            }
        });
        return false;
    });

    /*================================
    user_verify
    ==================================*/
    $("#btn_user_verify").on("click", function(event){
        if(!web3.eth.defaultAccount){
            alert("메타마스크 로그인 상태를 확인해 주세요");
            return false;
        }else{
            window.location = "/user_verify?address="+web3.eth.defaultAccount;
        }
    });

    /*================================
    sidebar collapsing
    ==================================*/
    $('.nav-btn').on('click', function() {
        $('.page-container').toggleClass('sbar_collapsed');
    });

    /*================================
    Start Footer resizer
    ==================================*/
    var e = function() {
        var e = (window.innerHeight > 0 ? window.innerHeight : this.screen.height) - 5;
        (e -= 67) < 1 && (e = 1), e > 67 && $(".main-content").css("min-height", e + "px")
    };
    $(window).ready(e), $(window).on("resize", e);

    /*================================
    sidebar menu
    ==================================*/
    $("#menu").metisMenu();

    /*================================
    slimscroll activation
    ==================================*/
    $('.menu-inner').slimScroll({
        height: 'auto'
    });
    $('.nofity-list').slimScroll({
        height: '435px'
    });
    $('.timeline-area').slimScroll({
        height: '500px'
    });
    $('.recent-activity').slimScroll({
        height: 'calc(100vh - 114px)'
    });
    $('.settings-list').slimScroll({
        height: 'calc(100vh - 158px)'
    });

    /*================================
    stickey Header
    ==================================*/
    $(window).on('scroll', function() {
        var scroll = $(window).scrollTop(),
            mainHeader = $('#sticky-header'),
            mainHeaderHeight = mainHeader.innerHeight();

        // console.log(mainHeader.innerHeight());
        if (scroll > 1) {
            $("#sticky-header").addClass("sticky-menu");
        } else {
            $("#sticky-header").removeClass("sticky-menu");
        }
    });

    /*================================
    form bootstrap validation
    ==================================*/
    $('[data-toggle="popover"]').popover();

    $('[data-toggle="tooltip"]').tooltip();

    /*------------- Start form Validation -------------*/
    window.addEventListener('load', function() {
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.getElementsByClassName('needs-validation');
        // Loop over them and prevent submission
        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);

    /*================================
    datatable active
    ==================================*/
    if ($('#dataTable').length) {
        $('#dataTable').DataTable({
            responsive: true
        });
    }
    if ($('#dataTable2').length) {
        $('#dataTable2').DataTable({
            responsive: true
        });
    }
    if ($('#dataTable3').length) {
        $('#dataTable3').DataTable({
            responsive: true
        });
    }


    /*================================
    Slicknav mobile menu
    ==================================*/
    $('ul#nav_menu').slicknav({
        prependTo: "#mobile_menu"
    });

    /*================================
    login form
    ==================================*/
    $('.form-gp input').on('focus', function() {
        $(this).parent('.form-gp').addClass('focused');
    });
    $('.form-gp input').on('focusout', function() {
        if ($(this).val().length === 0) {
            $(this).parent('.form-gp').removeClass('focused');
        }
    });

    /*================================
    slider-area background setting
    ==================================*/
    $('.settings-btn, .offset-close').on('click', function() {
        $('.offset-area').toggleClass('show_hide');
        $('.settings-btn').toggleClass('active');
    });

    /*================================
    Owl Carousel
    ==================================*/
    function slider_area() {
        var owl = $('.testimonial-carousel').owlCarousel({
            margin: 50,
            loop: true,
            autoplay: false,
            nav: false,
            dots: true,
            responsive: {
                0: {
                    items: 1
                },
                450: {
                    items: 1
                },
                768: {
                    items: 2
                },
                1000: {
                    items: 2
                },
                1360: {
                    items: 1
                },
                1600: {
                    items: 2
                }
            }
        });
    }
    slider_area();

    /*================================
    Fullscreen Page
    ==================================*/

    if ($('#full-view').length) {

        var requestFullscreen = function(ele) {
            if (ele.requestFullscreen) {
                ele.requestFullscreen();
            } else if (ele.webkitRequestFullscreen) {
                ele.webkitRequestFullscreen();
            } else if (ele.mozRequestFullScreen) {
                ele.mozRequestFullScreen();
            } else if (ele.msRequestFullscreen) {
                ele.msRequestFullscreen();
            } else {
                console.log('Fullscreen API is not supported.');
            }
        };

        var exitFullscreen = function() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else {
                console.log('Fullscreen API is not supported.');
            }
        };

        var fsDocButton = document.getElementById('full-view');
        var fsExitDocButton = document.getElementById('full-view-exit');

        fsDocButton.addEventListener('click', function(e) {
            e.preventDefault();
            requestFullscreen(document.documentElement);
            $('body').addClass('expanded');
        });

        fsExitDocButton.addEventListener('click', function(e) {
            e.preventDefault();
            exitFullscreen();
            $('body').removeClass('expanded');
        });
    }

})(jQuery);