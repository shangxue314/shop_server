const mongoose = require('mongoose')
const couponSchema = require('../schemas/coupons')
module.exports = mongoose.model('Coupon',couponSchema)
