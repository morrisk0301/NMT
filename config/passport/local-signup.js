const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
const node_smtpTransport = require('nodemailer-smtp-transport');
const hash = require('../../utils/hash');

function emailVerify(newUser, host){
    return new Promise(async function(resolve, reject){
        const token = await hash.generateHash(20);
        const url = "http://"+host+"/verify/"+token;

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
            to: newUser.user_email,
            from: 'Do Not Reply<sayjong_alom@naver.com>',
            subject: 'NMT 이메일 인증',
            html: "<p><a href="+url+">여기를 클릭하시면 이메일 인증이 완료 됩니다.</a> 이 주소를 " +
                "브라우저에 복사하고 접속하셔도 인증이 완료 됩니다.:</p><p>"+url+"</p>",
            text: "Please verify your account by clicking the following link, or by copying and pasting it into your browser: "+url
        };

        newUser.user_password_token = token;
        newUser.user_password_expires = Date.now() + 3600000;

        smtpTransport.sendMail(mailOptions, function(err) {
            if(err)
                reject(err);
            newUser.save(function(err, save_result){
                if(err)
                    reject(err);
                else
                    resolve(save_result.user_id);
            })
        });
    })
}

module.exports = new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true    // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
}, function(req, email, password, done) {
    // 요청 파라미터 중 name 파라미터 확인
    const paramName = req.body.name;
    const paramType = req.body.is_seller ? 2 : 1;

    // findOne 메소드가 blocking되지 않도록 하고 싶은 경우, async 방식으로 변경
    process.nextTick(function() {
        const database = req.app.get('database');

        database.UserModel.findOne({'user_email': email}, async function (err, user) {
            // 에러 발생 시
            if (err)
                throw err;
            if(user){
                if(user.user_is_verified)
                    return done('이미 회원가입 유저 에러');
                else if(!user.user_is_verified){
                    const verifyResult = await emailVerify(user, req.get('host'));
                    return done(verifyResult);
                }
            }
            else {
                const keyPair = await hash.generateKeyPair();
                const newUser = new database.UserModel({
                    'user_email': email, 'password': password, 'user_name': paramName,
                    'user_type': paramType
                });

                const user_id = await emailVerify(newUser, req.get('host'));
                const newKey = new database.UserKeyModel({
                    'uk_user_id': user_id,
                    'uk_public_key': keyPair.publicKey,
                    'uk_private_key': keyPair.privateKey
                });
                newKey.save(function(err){
                    if(err)
                        throw err;
                    return done("이메일 인증 메일 전송");
                })
            }
        })
    })
});
