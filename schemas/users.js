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
// 订单子文档
let order = new mongoose.Schema({
    pid: String,
    num: Number,
    totalPrice: String,
    name: String,
    tel: String,
    address: String,
    couponPrice: String
})
// 积分列表子文档
let scorelist = new mongoose.Schema({
    num: String,
    date: Number,
    title: String,
    orderId: String
})
module.exports = new mongoose.Schema({
    username: String,
    password: {type: String, selecet: false},
    nickname: {type: String, default: ''},
    tel: {type: String, default: ''},
    sex: {type: String, default: ''},
    birth: {type: String, default: ''},
    photo: {type: String, default: ''},
    cartlist: [cartlist],
    favlist: {type: Array, default: []},
    score: {type: Number, default: 0},
    balance: {type: Number, default: 0},
    coupons: {type: Array, default: []},
    order: [order],
    address: [address],
    scorelist: [scorelist],
    footprint: {type: Array, default: []},
    signin: {type: String, default: ''}
})
