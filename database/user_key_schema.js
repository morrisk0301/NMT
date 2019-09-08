let Schema = {};
const autoIncrement = require('mongoose-auto-increment-fix');

Schema.createSchema = function(mongoose) {

    let UserKeySchema = mongoose.Schema({
        uk_user_id: {type: Number, unique: true, required: true}
        , uk_public_key: {type: String, unique: true, required: true}
        , uk_private_key: {type: String, unique: true, required: true}
        , created_at: {type: Date, 'default': Date.now}
    });

    console.log('UserKeySchema 정의함.');

    UserKeySchema.plugin(autoIncrement.plugin, {model: 'UserKeyModel', field: 'uk_id'});

    return UserKeySchema;
};

module.exports = Schema;

