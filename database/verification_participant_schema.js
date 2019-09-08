const mongoosePaginate = require('mongoose-paginate');
const autoIncrement = require('mongoose-auto-increment-fix');
let Schema = {};

Schema.createSchema = function(mongoose) {

    let VerificationParticipantSchema = mongoose.Schema({
        vp_trade_id: {type: Number, required: true}
        , vp_vd_id: {type: Number, required: true}
        , vp_user_id: {type: Number, required: true}
        , vp_user_address: {type: String, required: true}
        , vp_data_length: {type: Number, required: true}
        , vp_data: {type: Array}
        , vp_detail: {type: String}
        , vp_server_hash: {type: String, required: true, unique: true}
        , vp_accuracy: {type: Number, 'default': 0}
        , vp_is_finished: {type: Boolean, 'default': false}
        , vp_is_committed: {type: Boolean, 'default': false}
        , committed_at: {type: Date}
        , created_at: {type: Date, 'default': Date.now}
    });

    console.log('VerificationParticipantSchema 정의함.');

    VerificationParticipantSchema.plugin(mongoosePaginate);
    VerificationParticipantSchema.plugin(autoIncrement.plugin, {model: 'VerificationParticipantModel', field: 'vp_id'});

    return VerificationParticipantSchema;
};

module.exports = Schema;

