const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment-fix');
const data_verification = require('../utils/data_verification');
const cron = require('node-cron');

let database = {};

database.init = function(app, config) {
    console.log('[database/database/database.init()]');
    connect(app, config);
};

function connect(app, config) {
    console.log('connect() 호출됨.');

    mongoose.Promise = global.Promise;
    mongoose.connect(config.db_url);

    database.db = mongoose.connection;

    autoIncrement.initialize(database.db);

    database.db.on('error', console.error.bind(console, 'mongoose connection error.'));
    database.db.on('open', async function () {
        console.log('데이터베이스에 연결되었습니다. : ' + config.db_url);

        await createSchema(app, config);
        cron.schedule('* 3 * * *', async () => {
            console.log('검증 미완료 유저 초기화 시작!');
            await data_verification.resetVerification(database);
        });

    });
    database.db.on('disconnected', connect);
}

function createSchema(app, config) {
    return new Promise(function(resolve, reject) {
        console.log('설정에 정의된 스키마의 수 : %d', config.db_schemas.length);

        config.db_schemas.reduce(function (total, item, counter) {
            return total.then(async function () {

                // 모듈 파일에서 모듈 불러온 후 createSchema() 함수 호출하기
                let curSchema = require(item.file).createSchema(mongoose);
                console.log('%s 모듈을 불러들인 후 스키마 정의함.', item.file);

                let curModel = mongoose.model(item.collection, curSchema);
                console.log('%s 컬렉션을 위해 모델 정의함.', item.collection);

                // database 객체에 속성으로 추가
                database[item.schemaName] = curSchema;
                database[item.modelName] = curModel;
                console.log('스키마 이름 [%s], 모델 이름 [%s] 이 database 객체의 속성으로 추가됨.', item.schemaName, item.modelName);
            });
        }, Promise.resolve()).then(function () {
            app.set('database', database);
            resolve(true);
        });
    });
}

module.exports = {database, mongoose};