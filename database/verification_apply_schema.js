let Schema = {};
const mongoosePaginate = require('mongoose-paginate');
const autoIncrement = require('mongoose-auto-increment-fix');

Schema.createSchema = function(mongoose) {

    let VerificationApplySchema = mongoose.Schema({
        va_user_id: {type: Number, required: true}
        , va_name: {type: String, required: true}
        , va_phone: {type: String, required: true}
        , va_major_big : {type: String, required: true}
        , va_major_small : {type: String, required: true}
        , va_academic : {type: String, required: true}
        , va_academic_img: {type: String}
        , va_year: {type: Number, required: true}
        , va_year_img: {type: String, required: true}
        , va_is_verified: {type: Boolean, 'default': false}
        , created_at: {type: Date, 'default': Date.now}
    });

    console.log('VerificationApplySchema 정의함.');

    VerificationApplySchema.plugin(mongoosePaginate);
    VerificationApplySchema.plugin(autoIncrement.plugin, {model: 'VerificationApplyModel', field: 'va_id'});

    return VerificationApplySchema;
};

module.exports = Schema;

