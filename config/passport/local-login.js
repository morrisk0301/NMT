const LocalStrategy = require('passport-local').Strategy;

module.exports = new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true   // 이 옵션을 설정하면 아래 콜백 함수의 첫번째 파라미터로 req 객체 전달됨
}, function(req, email, password, done) {
    console.log('passport의 local-login 호출됨 : ' + email);

    const database = req.app.get('database');

    database.UserModel.findOne({ 'user_email' :  email }, function(err, user) {
        if (err)
            throw err;

        // 등록된 사용자가 없는 경우
        if (!user)
            return done(null, null, "사용자 없음 에러");
        else{
            if(user.user_is_unregistered)
                return done(null, null, "탈퇴 회원 에러");

            if(!user.user_is_verified)
                return done(null, null, "이메일 미인증 에러");

            const authenticated = user.authenticate(password, user._doc.salt, user._doc.pwd_hashed);

            if (!authenticated)
                return done(null, null, "비밀번호 에러");
            else{
                if(user.user_type===0)
                    return done(null, user, "관리자 로그인 성공");
                else
                    return done(null, user, "로그인 성공");
            }
        }
    });
});

