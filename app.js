const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use('/',require('./routers/api'))
app.use(express.static('public')) // 静态资源托管，可直接访问public目录下文件

mongoose.connect('mongodb://82.157.103.3:27022/shop',{useUnifiedTopology: true,useNewUrlParser: true},err=>{
    if(err){
        console.log('数据库链接失败');
    }else{
        console.log('数据库链接成功');
        app.listen(54321)
    }
})
