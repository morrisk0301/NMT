const nodemailer = require('nodemailer');
const node_smtpTransport = require('nodemailer-smtp-transport');
const hash = require('../utils/hash');

function emailVerify(user, host) {
    return new Promise(async function (resolve, reject) {
        const token = await hash.generateHash(20);
        const url = "http://" + host + "/reset/" + token;

        const smtpTransport = nodemailer.createTransport(node_smtpTransport({
            host: 'smtp.naver.com', // Office 365 server
            port: 587,     // secure SMTP
            secureConnection: false, // false for TLS - as a boolean not string - but the default is false so just remove this completely
            auth: {
                user: 'sayjong_alom',
                pass: 'sayjong2@'
            },
            tls: {
                ciphers: 'SSLv3'
            }
        }));
        const mailOptions = {
            to: user.user_email,
            from: 'Do Not Reply<sayjong_alom@naver.com>',
            subject: 'NMT 비밀번호 재설정',
            html: "<p>NMT 비밀번호 변경을 위한 이메일 입니다</p><br><br><p><a href = " + url + ">" +
                "이 링크를 클릭하시거나 주소를 브라우저에 복사해서 입력하시기 바랍니다:</a></p><br><p>" +
                url + "</p>"
        };

        user.user_password_token = token;
        user.user_password_expires = Date.now() + 3600000;

        smtpTransport.sendMail(mailOptions, function (err) {
            if (err)
                reject(err);
            user.save(function (err) {
                if (err)
                    reject(err);
                else
                    resolve("이메일 인증 메일 전송");
            })
        });
    })
}


module.exports = function (router, passport) {

    router.get('/verify/:token', function (req, res) {
        const database = req.app.get('database');
        const token = req.params.token;

        database.UserModel.findOne({
            user_password_token: token,
            user_password_expires: {$gt: Date.now()}
        }, function (err, user) {
            if (err)
                throw err;
            if (!user) {
                res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                res.write('<script type="text/javascript">alert("유저가 없거나 이미 인증되었습니다.");window.close();</script>');
                res.end();
            } else {
                user.user_is_verified = true;
                user.user_password_token = undefined;
                user.user_password_expires = undefined;
                user.save(function (err) {
                    if (err)
                        throw err;
                    res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                    res.write('<script type="text/javascript">alert("이메일 인증 완료!");window.close();</script>');
                    res.end();
                })
            }
        });
    });

    router.get('/emailReset/:email', function (req, res) {
        const database = req.app.get('database');
        const userEmail = req.params.email;

        database.UserModel.findOne({
            'user_email': userEmail
        }, async function (err, user) {
            if (err) throw err;
            if (!user)
                return res.json({err: "등록된 이메일이 존재하지 않습니다."});
            else if (user.user_is_unregistered)
                return res.json({err: "탈퇴한 회원입니다."});

            const forgotResult = await emailVerify(user, req.get('host'));
            res.json({forgot: forgotResult});
        });
    });

    router.route('/reset/:token').get(function (req, res) {
        const database = req.app.get('database');
        const token = req.params.token;

        database.UserModel.findOne({
            user_password_token: token,
            user_password_expires: {$gt: Date.now()}
        }, function (err, user) {
            if (err)
                throw err;
            if (!user) {
                res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                res.write('<script type="text/javascript">alert("유저가 없거나 이미 인증되었습니다.");window.close();</script>');
                res.end();
            } else {
                res.render('reset', {token: token, email: user.user_email});
            }
        });
    });

    router.get('/logout', function (req, res) {
        req.logout();
        res.json({logout: true});
    });

    router.post('/signup', function (req, res, next) {
        if (req.body.email === '' || !req.body.email || req.body.password === '' || !req.body.password || req.body.name === '' || !req.body.name)
            return res.json({err: "필수 입력 필드 에러"});
        else {
            passport.authenticate('local_signup', {
                failureFlash: true
            }, function (message) {
                if(message === "이메일 인증 메일 전송")
                    res.json({signup: message});
                else
                    res.json({err: message});
            })(req, res, next);
        }
    });

    router.post('/login', function (req, res) {
        if (req.body.email === '' || req.body.password === '' || !req.body.email || !req.body.password)
            return res.json({err: "필수 입력 필드 에러"});
        passport.authenticate('local_login', {
            failureFlash: false
        }, function (err, user, message) {
            console.log(message);
            if (err)
                throw err;
            if (message === "관리자 로그인 성공" || message === "로그인 성공") {
                req.login(user, function (err) {
                    if (err)
                        throw err;
                    res.json({login: message, user: user});
                });
            } else {
                res.json({err: message});
            }
        })(req, res);
    });

    router.post('/reset', function (req, res) {
        const database = req.app.get('database');
        const token = req.body.token;

        database.UserModel.findOne({
            user_password_token: token,
            user_password_expires: {$gt: Date.now()}
        }, function (err, user) {
            if (!user) {
                res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
                res.write('<script type="text/javascript">alert("비밀번호 토큰이 만료되었습니다.");window.close();</script>');
                res.end();
                return;
            }

            user.password = req.body.password;
            user.user_password_token = undefined;
            user.user_password_expires = undefined;

            user.save(function (err) {
                if (err)
                    res.render('complete', {reset: false});
                else
                    res.render('complete', {reset: true});
            });
        });
    });

    router.put('/withdrawal', function (req, res) {
        if (!req.user)
            return res.json({login: false});

        const database = req.app.get('database');
        const email = req.user.user_email;

        database.UserModel.findOne({
            'user_email': email
        }, function (err, result) {
            if (err)
                throw err;
            result.user_is_unregistered = true;
            result.save(function (err) {
                if (err)
                    throw err;
                req.logout();
                res.json({withdrawal: true});
            })
        })
    });
};
