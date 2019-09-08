const mongoosePaginate = require('mongoose-paginate');
const autoIncrement = require('mongoose-auto-increment-fix');
let Schema = {};

Schema.createSchema = function(mongoose) {

    let SaleParticipantSchema = mongoose.Schema({
        sp_trade_id: {type: Number, required: true}
        , sp_user_id: {type: Number, required: true}
        , sp_user_address: {type: String, required: true}
        , sp_file_name: {type: String, required: true}
        , sp_detail: {type: String,'default': ""}
        , sp_server_hash: {type: String, required: true, unique: true}
        , sp_file_hash: {type: String, required: true}
        , sp_key: {type:String, required: true}
        , sp_is_committed: {type: Boolean, 'default': false}
        , sp_vp_detail: {type: Array}
        , committed_at: {type: Date}
        , created_at: {type: Date, 'default': Date.now}
    });

    console.log('SaleParticipantSchema 정의함.');

    SaleParticipantSchema.plugin(mongoosePaginate);
    SaleParticipantSchema.plugin(autoIncrement.plugin, {model: 'SaleParticipantModel', field: 'sp_id'});

    return SaleParticipantSchema;
};

module.exports = Schema;

