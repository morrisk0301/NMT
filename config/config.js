module.exports = {
    db_url: 'mongodb://localhost:27017/local',
    db_schemas: [
        {file:'./user_schema', collection:'user', schemaName:'UserSchema', modelName:'UserModel'},
        {file:'./user_key_schema', collection:'user_key', schemaName:'UserKeySchema', modelName:'UserKeyModel'},
        {file:'./trade_schema', collection:'trade', schemaName:'TradeSchema', modelName:'TradeModel'},
        {file:'./sale_participant_schema', collection:'sale_participant', schemaName:'SaleParticipantSchema', modelName:'SaleParticipantModel'},
        {file:'./verification_participant_schema', collection:'verification_participant', schemaName:'VerificationParticipantSchema', modelName:'VerificationParticipantModel'},
        {file:'./verification_data_schema', collection:'verification_data', schemaName:'VerificationDataSchema', modelName:'VerificationDataModel'},
        {file:'./verification_apply_schema', collection:'verification_apply', schemaName:'VerificationApplySchema', modelName:'VerificationApplyModel'},
    ],
};