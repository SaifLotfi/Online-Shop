const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchmea = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
    },
    items:[
        {
            title:{
                type:String,
                required:true
            },
            quantity:{
                type:Number,
                required:true
            },
            price:{
                type:Number,
                required:true
            }
        }
    ]
});

module.exports = mongoose.model('Order',orderSchmea);