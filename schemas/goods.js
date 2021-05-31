const mongoose = require('mongoose')
module.exports = new mongoose.Schema({
    name: String,
    brand: String,
    sort: String,
    fun: String,
    sales: Number,
    bbs: Number,
    price: Number,
    pic: String,
    info: {type: Object, default: {}},
})
