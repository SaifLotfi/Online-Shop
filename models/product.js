const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchmea = new Schema({
    title:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    imageUrl:{
        type:String,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        require:true,
        ref:'User'
    }
})

module.exports = mongoose.model('Product',productSchmea);

// const getDb = require('../util/database').getDb;
// const mongodb = require('mongodb');
// class Product {
//     constructor(productData) {
//         const { title, imageUrl, price, description,userId } = productData;
//         this.title = title;
//         this.imageUrl = imageUrl;
//         this.price = price;
//         this.description = description;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         return db
//             .collection('products')
//             .insertOne(this)
//             .then((result) => {
//                 console.log('model', result);
//                 return 'hello';
//             })
//             .catch((err) => console.log(err));
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db
//             .collection('products')
//             .find()
//             .toArray()
//             .then((products) => {
//                 return products;
//             })
//             .catch((err) => console.log(err));
//     }

//     static findById(id) {
//         const db = getDb();
//         return db
//             .collection('products')
//             .find({ _id: new mongodb.ObjectId(id) })
//             .next()
//             .then((product) => {
//                 return product;
//             })
//             .catch((err) => console.log(err));
//     }

//     static editById(id, updatedData) {
//         const db = getDb();
//         const { title, imageUrl, price, description } = updatedData;
//         return db
//             .collection('products')
//             .findOneAndUpdate(
//                 { _id: new mongodb.ObjectId(id) },
//                 {
//                     $set: {
//                         title: title,
//                         imageUrl: imageUrl,
//                         price: price,
//                         description: description,
//                     },
//                 }
//             )
//             .then((result) => {
//                 console.log('modres', result);
//                 return result;
//             })
//             .catch((err) => console.log(err));
//     }

//     static deleteById(id) {
//         const db = getDb();
//         return db
//             .collection('products')
//             .deleteOne({ _id: new mongodb.ObjectId(id) })
//             .then((result) => {
//                 console.log(result);
//             })
//             .catch((err) => console.log(err));
//     }
// }

// module.exports = Product;
