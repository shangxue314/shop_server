const mongoose = require('mongoose')
module.exports = new mongoose.Schema({
    username: String,
    password: String,
    nickname: String,
    tel: String,
    sex: String,
    birth: String,
    photo: String,
    cartlist: Array,
    favlist: Array,
    score: Number,
    balance: Number,
    coupons: Array,
    order: Array,
    address: Array
})
