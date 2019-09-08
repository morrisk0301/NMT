const mongoosePaginate = require('mongoose-paginate');
const autoIncrement = require('mongoose-auto-increment-fix');
let Schema = {};

Schema.createSchema = function(mongoose) {

    let TradeSchema = mongoose.Schema({
        trade_head: {type: String, 'default': ""}
        , trade_body: {type: String, 'default': ""}
        , trade_img: {type: Array}
        , trade_category: {type: String, 'default': ""}
        , trade_verification_command: {type: String, required: true}
        , trade_contract_address: {type: String, required: true}
        , trade_user_id: {type: Number, required: true}
        , trade_major_big: {type: String, required: true}
        , trade_major_small: {type: String, required: true}
        , trade_status: {type: String, 'default': 'running'}
        , created_at: {type: Date, 'default': Date.now}
        , updated_at: {type: Date, 'default': Date.now}
    });

    console.log('TradeSchema 정의함.');

    TradeSchema.plugin(mongoosePaginate);
    TradeSchema.plugin(autoIncrement.plugin, {model: 'TradeModel', field: 'trade_id'});

    return TradeSchema;
};

module.exports = Schema;

