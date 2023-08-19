const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
/** @type {mongodb.Db} */
let _db; 

const mongoConnect = (cb) => {
    MongoClient.connect(
        process.env.MONGO_URI
    )
        .then((client) => {
            console.log('Connected!');
            cb();
            _db = client.db('shop');
        })
        .catch(err=>{
            console.log(err);
        });
};

const getDb = ()=>{
    if(_db){
        return _db;
    }else{
        throw 'No Database found!';
    }
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
