const express = require('express')
const router = express.Router()
const Phone = require('../models/Phone')
const User = require('../models/User')
const des = require('../utils/des.js')
const multer = require('multer')

// 统一返回数据格式
let responseData;
router.use((req,res,next)=>{
    responseData = {
        code: 0,
        message: ''
    }
    next()
})

// 获取手机列表
router.get('/phones',(req,res)=>{
    Phone.find({}).then(phoneInfo=>{
        responseData.code = 0
        responseData.message = '查询所有数据'
        responseData.data = phoneInfo
        res.json(responseData)
    })
})

// 获取手机详情
router.get('/phones/:_id',(req,res)=>{
    Phone.findOne({
        _id: req.params._id
    }).then(phoneInfo=>{
        responseData.code = 0
        responseData.message = '请求成功'
        responseData.data = phoneInfo
        res.json(responseData)
    })
})

// 添加手机
router.post('/phone',(req,res)=>{
    Phone.findOne({
        name: req.body.name
    }).then(phoneInfo=>{
        if(phoneInfo){
            // 数据库中已有该型号手机
            responseData.code = 4
            responseData.message = '已有相同型号手机'
            res.json(responseData)
            return
        }
        // 保存机型
        let phone = new Phone(req.body)
        return phone.save()
    }).then(newPhoneInfo=>{
        responseData.code = 0
        responseData.message = '添加手机成功'
        res.json(responseData)
    })
})

// 更新手机
router.put('/phones/:_id',(req,res)=>{
    Phone.findByIdAndUpdate(req.params._id,req.body,()=>{
        responseData.code = 0
        responseData.message = '更新成功'
        res.json(responseData)
    })
})

// 添加购物车
router.post('/cart',(req,res)=>{
    User.updateOne({
        username: req.body.username
    },{
        '$push': {
            cartlist: req.body.phoneid
        }
    }).then(addRes=>{
        if(addRes.nModified){
            // 添加成功,返回购物车数据
            User.findOne({username: req.body.username}).then(userInfo=>{
                responseData.code = 0
                responseData.message = '添加成功'
                responseData.data = userInfo.cartlist
                res.json(responseData)
            })
        }
    })
})

// 添加收藏
router.post('/fav',(req,res)=>{
    User.updateOne({
        username: req.body.username
    },{
        '$addToSet': {
            favlist: req.body.phoneid
        }
    }).then(addRes=>{
        if(addRes.nModified){
            // 添加成功,返回收藏数据
            User.findOne({username: req.body.username}).then(userInfo=>{
                responseData.code = 0
                responseData.message = '收藏成功'
                responseData.data = userInfo.favlist
                res.json(responseData)
            })
        }else{
            // 已收藏过
            User.updateOne({
                username: req.body.username
            },{
                '$pull': {
                    favlist: req.body.phoneid
                }
            }).then(addRes=>{
                User.findOne({username: req.body.username}).then(userInfo=>{
                    responseData.code = 0
                    responseData.message = '取消收藏'
                    responseData.data = userInfo.favlist
                    res.json(responseData)
                })
            })
        }
    })
})

// 获取用户信息
router.get('/user',(req,res)=>{
    User.findOne({username: req.query.username}).then(userInfo=>{
        responseData.code = 0
        responseData.message = '查询用户信息'
        responseData.data = userInfo
        res.json(responseData)
    })
})

// 获取收藏商品列表详情
router.get('/fav',(req,res)=>{
    Phone.find({
        _id: {$in:JSON.parse(req.query.favlist)}
    }).then(favInfo=>{
        responseData.code = 0
        responseData.message = '查询收藏信息'
        responseData.data = favInfo
        res.json(responseData)
    })
})

// 获取购物车商品列表详情
router.get('/cart',(req,res)=>{
    Phone.find({
        _id: {$in:JSON.parse(req.query.cartlist)}
    }).then(cartInfo=>{
        responseData.code = 0
        responseData.message = '查询购物车信息'
        responseData.data = cartInfo
        res.json(responseData)
    })
})

// 删除购物车商品
router.delete('/cart',async (req,res)=>{
    let result = await User.updateOne({
        username: req.body.username
    },{
        '$pull': {
            cartlist: req.body.phoneid
        }
    })
    if(result.ok){
        // 删除成功
        let userInfo = await User.findOne({username: req.body.username})
        responseData.code = 0
        responseData.message = '删除成功'
        responseData.data = userInfo.cartlist
    }else{
        // 删除失败
        responseData.code = 2
        responseData.message = '删除失败'
    }
    res.json(responseData)
})

// 登录
router.post('/login',async (req,res)=>{
    let {username,password} = req.body
    let userInfo = await User.findOne({
        username,
        password
    })
    if(userInfo){
        // 成功
        responseData.code = 0
        responseData.message = '登录成功'
        responseData.data = userInfo
    }else{
        // 失败
        responseData.code = 2
        responseData.message = '用户名或密码错误'
    }
    res.json(responseData)
})

// 上传头像
let upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, './public/photos/');
        },
        filename(req, file, cb) {
            let changedName = (new Date().getTime())+'-'+file.originalname;
            cb(null, changedName);
        }
    })
})
//单个文件上传
router.post('/single',upload.single('singleFile'),async (req,res)=>{
    console.log(req.file);
    // let photoPath = 'api/'+req.file.path.split('public/')[1]
    let photoPath = 'api/photos/'+req.file.filename
    let result = await User.updateOne({
        username: req.body.username
    },{
        '$set': {
            photo: photoPath
        }
    })
    if(result){
        responseData.code = 0
        responseData.message = '上传成功'
        responseData.data = {
            originalname: req.file.originalname,
            path: photoPath
        }
    }else{
        responseData.code = 2
        responseData.message = '上传失败'
    }
    res.json(responseData)
})
router.get('/public/photos/*',(req,res)=>{
    res.sendFile(__dirname+'/'+req.url)
})

// 更新昵称
router.put('/nickname',async (req,res)=>{
    let result = await User.updateOne({
        username: req.body.username
    },{
        '$set': {
            nickname: req.body.nickname
        }
    })
    if(result){
        responseData.code = 0
        responseData.message = '更新成功'
    }else{
        responseData.code = 2
        responseData.message = '更新失败'
    }
    res.json(responseData)
})

// 更新性别
router.put('/sex',async (req,res)=>{
    let result = await User.updateOne({
        username: req.body.username
    },{
        '$set': {
            sex: req.body.sex
        }
    })
    if(result){
        responseData.code = 0
        responseData.message = '更新成功'
    }else{
        responseData.code = 2
        responseData.message = '更新失败'
    }
    res.json(responseData)
})

// 更新生日
router.put('/birth',async (req,res)=>{
    let result = await User.updateOne({
        username: req.body.username
    },{
        '$set': {
            birth: req.body.birth
        }
    })
    if(result){
        responseData.code = 0
        responseData.message = '更新成功'
    }else{
        responseData.code = 2
        responseData.message = '更新失败'
    }
    res.json(responseData)
})

// 新增地址
router.post('/address',async(req,res)=>{
    // 增加详细地址字段address
    let {city,province,county,addressDetail} = req.body.address
    req.body.address.address = city==province ? city+county+addressDetail : city+province+county+addressDetail

    let result = await User.updateOne({
        username: req.body.username
    },{
        '$push': {
            address: req.body.address
        }
    })
    if(result){
        let userInfo = await User.findOne({username: req.body.username})
        responseData.code = 0
        responseData.message = '添加成功'
        responseData.data = userInfo.address
    }else{
        responseData.code = 2
        responseData.message = '添加失败'
    }
    res.json(responseData)
})

module.exports = router
