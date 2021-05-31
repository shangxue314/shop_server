const mongoose = require('mongoose')
// 地址子文档
let address = new mongoose.Schema({
    name : String,
    tel : String,
    country : String,
    province : String,
    city : String,
    county : String,
    areaCode : String,
    postalCode : String,
    addressDetail : String,
    isDefault : Boolean,
    address : String
})
// 购物车子文档
let cartlist = new mongoose.Schema({
    id : String,
    num: {type: Number, default: 0}
})
module.exports = new mongoose.Schema({
    username: String,
    password: String,
    nickname: {type: String, default: ''},
    tel: {type: String, default: ''},
    sex: {type: String, default: ''},
    birth: {type: String, default: ''},
    photo: {type: String, default: ''},
    cartlist: {type: Array, default: [cartlist]},
    favlist: {type: Array, default: []},
    score: {type: Number, default: 0},
    balance: {type: Number, default: 0},
    coupons: {type: Array, default: []},
    order: {type: Array, default: []},
    address: [address]
})
