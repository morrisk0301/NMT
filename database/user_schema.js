const crypto = require('crypto');
const autoIncrement = require('mongoose-auto-increment-fix');

let Schema = {};

Schema.createSchema = function(mongoose) {

    // 스키마 정의
    let UserSchema = mongoose.Schema({
        user_email: {type: String, required: true}
        , pwd_hashed: {type: String, 'default':''}
        , salt: {type: String}
        , user_password_token : {type: String}
        , user_password_expires: {type: Date}
        , user_name: {type: String, index: 'hashed', 'default':''}
        , user_is_verified: {type: Boolean, 'default':false}
        , user_type: {type: Number, 'default': 1}
        , user_is_unregistered: {type: Boolean, 'default':false}
        , created_at: {type: Date, 'default': Date.now}
    });

    // password를 virtual 메소드로 정의 : MongoDB에 저장되지 않는 편리한 속성임. 특정 속성을 지정하고 set, get 메소드를 정의함
    UserSchema
        .virtual('password')
        .set(function(password) {
            this._password = password;
            this.salt = this.makeSalt();
            this.pwd_hashed = this.encryptPassword(password);
            console.log('virtual password 호출됨 : ' + this.pwd_hashed);
        })
        .get(function() { return this._password });

    // 스키마에 모델 인스턴스에서 사용할 수 있는 메소드 추가
    // 비밀번호 암호화 메소드
    UserSchema.method('encryptPassword', function(plainText, inSalt) {
        if (inSalt) {
            return crypto.createHmac('sha1', inSalt).update(plainText).digest('hex');
        } else {
            return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
        }
    });

    // salt 값 만들기 메소드
    UserSchema.method('makeSalt', function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    });

    // 인증 메소드 - 입력된 비밀번호와 비교 (true/false 리턴)
    UserSchema.method('authenticate', function(plainText, inSalt, pwd_hashed) {
        if (inSalt) {
            console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText, inSalt), pwd_hashed);
            return this.encryptPassword(plainText, inSalt) === pwd_hashed;
        } else {
            console.log('authenticate 호출됨 : %s -> %s : %s', plainText, this.encryptPassword(plainText), this.pwd_hashed);
            return this.encryptPassword(plainText) === this.pwd_hashed;
        }
    });

    /*
    UserSchema_sj.pre('save', function(next) {
        if (!this.isNew) return next();
        next();
    });
    */

    UserSchema.plugin(autoIncrement.plugin, {model: 'UserModel', field: 'user_id'});

    console.log('UserSchema 정의함.');

    return UserSchema;
};

// module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;

