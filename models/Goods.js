const mongoose = require('mongoose')
const goodsSchema = require('../schemas/Goods')
module.exports = mongoose.model('goods',goodsSchema)
