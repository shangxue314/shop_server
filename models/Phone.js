const mongoose = require('mongoose')
const phonesSchema = require('../schemas/phones')
module.exports = mongoose.model('Phone',phonesSchema)
