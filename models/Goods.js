const mongoose = require('mongoose')
const goodsSchema = require('../schemas/goods')
module.exports = mongoose.model('goods',goodsSchema)
