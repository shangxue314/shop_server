const mongoose = require('mongoose')
module.exports = new mongoose.Schema({
    name: String,
    condition: String,
    startAt: Number,
    endAt: Number,
    description: String,
    reason: String,
    value: Number,
    valueDesc: String,
    unitDesc: String
})
