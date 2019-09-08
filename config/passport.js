const local_login = require('./passport/local-login');
const local_signup = require('./passport/local-signup');

module.exports = function (app, passport) {
    console.log('config/passport 호출됨.');

    // 사용자 인증 성공 시 호출
    // 사용자 정보를 이용해 세션을 만듦
    // 로그인 이후에 들어오는 요청은 deserializeUser 메소드 안에서 이 세션을 확인할 수 있음
    passport.serializeUser(function (user, done) {
        //console.log('serializeUser() 호출됨.');

        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        //console.log('serializeUser() 호출됨.');

        done(null, user);
    });

    // 인증방식 설정
    passport.use('local_login', local_login);
    passport.use('local_signup', local_signup);
    console.log('2가지 passport 인증방식 설정됨.');

};