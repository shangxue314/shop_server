const mongoose = require('mongoose')
module.exports = new mongoose.Schema({
    name: String,
    brand: String,
    pixel: String,
    cpu: String,
    memory: String,
    price: Number,
    system: String,
    net: String,
    pic: String
})
