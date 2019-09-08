let Schema = {};
const autoIncrement = require('mongoose-auto-increment-fix');

Schema.createSchema = function(mongoose) {

    let VerificationDataSchema = mongoose.Schema({
        vd_sp_id: {type: Number, required: true}
        , vd_data: {type: Array, required: true}
        , vd_major_big: {type: String, required: true}
        , vd_major_small: {type: String, required: true}
        , vd_accuracy: {type: Number, 'default': 0}
        , vd_status: {type: String, 'default': 'running'}
        , vd_counter: {type: Number, 'default': 0}
        , created_at: {type: Date, 'default': Date.now}
    });

    console.log('VerificationDataSchema 정의함.');

    VerificationDataSchema.plugin(autoIncrement.plugin, {model: 'VerificationDataModel', field: 'vd_id'});

    return VerificationDataSchema;
};

module.exports = Schema;

