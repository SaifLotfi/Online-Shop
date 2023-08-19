const mongoose = require('mongoose');
const { schema } = require('./product');
const Order = require('./order');
const Schema = mongoose.Schema;
const techError = require('../util/tech-error');

const userSchema = new Schema({
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordTokenExpiration: {
        type:Date
    },
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    required: true,
                    ref: 'Product',
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
});

userSchema.methods.addOrder = function () {
    return this.populate('cart.items.productId')
        .then((user) => {
            console.log(user.cart.items);
            const orderProducts = user.cart.items.map((item) => {
                return { title: item.productId.title, quantity: item.quantity,price:item.productId.price };
            });
            const order = new Order({
                userId: this._id,
                items: orderProducts,
            });
            this.cart.items = [];
            return order.save();
        }).then(result=>{
            this.save();
        })
        .catch(err=>{
            console.log(err);
        });
};

userSchema.methods.getOrders = function () {
    return Order.find({
        userId: this._id,
    });
};

userSchema.methods.removeFromCart = function (productId) {
    console.log(this.cart.items)
    const deletedProductIndex = this.cart.items.findIndex(
        // (p) => p._id.toString() === productId.toString()
        (p) => p.productId.toString() === productId.toString()
    );
    const updatedCartItems = [...this.cart.items];
    updatedCartItems.splice(deletedProductIndex, 1);
    this.cart.items = [...updatedCartItems];
    return this.save();
};

userSchema.methods.addToCart = function (product) {
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    const cartProductIndex = this.cart.items.findIndex(
        (item) => item.productId.toString() === product._id.toString()
    );

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity,
        });
    }

    const updatedCart = { items: updatedCartItems };

    this.cart = { ...updatedCart };

    return this.save();
};

module.exports = mongoose.model('User', userSchema);

// const { getDb } = require('../util/database');
// const ObjectId = require('mongodb').ObjectId;
// const Product = require('./product');
// class User {
//     constructor(name, email, cart, _id) {
//         this.name = name;
//         this.email = email;
//         this.cart = cart;
//         this._id = _id;
//     }

//     save() {
//         const db = getDb();
//         return db
//             .collection('users')
//             .insertOne(this)
//             .then((result) => {
//                 console.log('ana ahooo', result);
//                 return result;
//             })
//             .catch((err) => console.log(err));
//     }

//     addToCart(product) {
//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];
//         const cartProductIndex = this.cart.items.findIndex(
//             (item) => item.productId.toString() === product._id.toString()
//         );

//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({
//                 productId: new ObjectId(product._id),
//                 quantity: newQuantity,
//             });
//         }

//         const updatedCart = { items: updatedCartItems };

//         this.cart = {...updatedCart};

//         const db = getDb();
//         return db.collection('users').findOneAndUpdate(
//             { _id: new ObjectId(this._id) },
//             {
//                 $set: {
//                     cart: updatedCart,
//                 },
//             }
//         );
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db
//             .collection('users')
//             .findOne({ _id: new ObjectId(userId) })
//             .then((user) => {
//                 return user;
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }

//     getCart(cb) {
//         const products = [];
//         return new Promise((resolve, reject) => {
//             if (this.cart.items.length > 0) {
//                 this.cart.items.forEach((item, index) => {
//                     Product.findById(item.productId.toString())
//                         .then((product) => {
//                             // console.log(product);
//                             product = { ...product, quantity: item.quantity };
//                             return products.push(product);
//                         })
//                         .then((result) => {
//                             if (this.cart.items.length === products.length) {
//                                 resolve(products);
//                             }
//                         })
//                         .catch((err) => {
//                             console.log(err);
//                             reject("forEach didn't finish Properly ");
//                         });
//                 });
//             } else {
//                 resolve([]);
//             }
//         });

//         //using Callback
//         // this.cart.items.forEach((item, index) => {
//         //     Product.findById(item.productId.toString())
//         //         .then((product) => {
//         //             // console.log(product);
//         //             product = { ...product, quantity: item.quantity };
//         //             return products.push(product);
//         //         })
//         //         .then((result) => {
//         //             if (this.cart.items.length === products.length) {
//         //                 cb(products);
//         //             }
//         //         })
//         //         .catch((err) => console.log(err));
//         // });
//     }

//     removeFromCart(id) {
//         const removedProductIndex = this.cart.items.findIndex(
//             (i) => i.productId.toString() === id.toString()
//         );
//         const updatedCart = { ...this.cart };

//         if (removedProductIndex >= 0) {
//             updatedCart.items.splice(removedProductIndex, 1);
//             const db = getDb();
//             return db
//                 .collection('users')
//                 .findOneAndUpdate(
//                     { _id: new ObjectId(this._id) },
//                     {
//                         $set: {
//                             cart: updatedCart,
//                         },
//                     }
//                 )
//                 .then((user) => {
//                     this.cart = { ...updatedCart };
//                     return user;
//                 })
//                 .catch((err) => {
//                     console.log(err);
//                 });
//         } else {
//             throw 'No Such Product with that Id';
//         }
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//             .then((products) => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name,
//                     },
//                 };
//                 return db.collection('orders').insertOne(order);
//             })
//             .then((result) => {
//                 console.log(result);
//                 this.cart.items = [];
//                 return db.collection('users').findOneAndUpdate(
//                     { _id: new ObjectId(this._id) },
//                     {
//                         $set: {
//                             cart: {
//                                 items: [],
//                             },
//                         },
//                     }
//                 );
//             })
//             .then((user) => {
//                 return user;
//             })
//             .catch((err) => console.log(err));
//     }

//     getOrders(){
//         const db = getDb();
//         return db.collection('orders').find({'user._id':new ObjectId(this._id)}).toArray();
//     }
// }

// module.exports = User;
