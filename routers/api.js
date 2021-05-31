const express = require('express')
const router = express.Router()
const Goods = require('../models/Goods')
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

// 获取商品列表
router.get('/goods',(req,res)=>{
    Goods.find({}).then(goodsInfo=>{
        responseData.code = 0
        responseData.message = '查询所有数据'
        responseData.data = goodsInfo
        res.json(responseData)
    })
})

// 获取商品详情
router.get('/goods/:_id',(req,res)=>{
    Goods.findOne({
        _id: req.params._id
    }).then(goodsInfo=>{
        responseData.code = 0
        responseData.message = '请求成功'
        responseData.data = goodsInfo
        res.json(responseData)
    })
})

// 添加商品
router.post('/goods',(req,res)=>{
    console.log(req.body);
    Goods.findOne({
        name: req.body.name
    }).then(goodsInfo=>{
        if(goodsInfo){
            // 数据库中已有该型号商品
            responseData.code = 4
            responseData.message = '已有相同型号商品'
            res.json(responseData)
            return
        }
        // 保存机型
        let goods = new Goods(req.body)
        return goods.save()
    }).then(newGoodsInfo=>{
        responseData.code = 0
        responseData.message = '添加商品成功'
        res.json(responseData)
    })
})

// 添加收藏
router.post('/fav',(req,res)=>{
    User.updateOne({
        username: req.body.username
    },{
        '$addToSet': {
            favlist: req.body.goodsid
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
                    favlist: req.body.goodsid
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
    Goods.find({
        _id: {$in:JSON.parse(req.query.favlist)}
    }).then(favInfo=>{
        responseData.code = 0
        responseData.message = '查询收藏信息'
        responseData.data = favInfo
        res.json(responseData)
    })
})

// 添加购物车
router.post('/cart',async (req,res)=>{
    let {username,goodsid} = req.body
    let doc = await User.findOne({
        username,
        'cartlist.id': goodsid
    });
    let addRes;
    if(!doc){
        addRes = await User.updateOne({
            username
        },{
            '$push': {
                cartlist: {
                    id: goodsid,
                    num: 1
                }
            }
        })
    }else{
        let {cartlist} = await User.findOne({
            'cartlist.id':  goodsid
        },{
            cartlist: 1
        })
        let num = 0
        cartlist.forEach(item=>{
            if(item.id==goodsid){
                num = item.num
            }
        })
        addRes = await User.updateOne({
            username,
            'cartlist.id': goodsid
        },{
            '$set': {
                'cartlist.$.num': num+1
            }
        })
    }
    if(addRes.nModified){
        // 添加成功,返回购物车数据
        User.findOne({username}).then(userInfo=>{
            responseData.code = 0
            responseData.message = '添加成功'
            responseData.data = userInfo.cartlist
            res.json(responseData)
        })
    }
})

// 修改购物车商品数量
router.put('/cart',async (req,res)=>{
    let {username,goodsid,num} = req.body
    let result = await User.updateOne({
        username,
        'cartlist.id': goodsid
    },{
        '$set': {
            'cartlist.$.num': num
        }
    })
    if(result.ok){
        let userInfo = await User.findOne({username})
        responseData.code = 0
        responseData.message = '修改成功'
        responseData.data = userInfo.cartlist
    }else{
        responseData.code = 2
        responseData.message = '修改失败'
    }
    res.json(responseData)
})

// 获取购物车商品列表详情
router.get('/cart',async (req,res)=>{
    let userInfo = await User.findOne({
        'cartlist.id':  {$in:JSON.parse(req.query.cartlist)}
    })
    Goods.find({
        _id: {$in:JSON.parse(req.query.cartlist)}
    }).then(cartInfo=>{
        cartInfo = cartInfo.map((item,index)=>Object.assign(item._doc,userInfo.cartlist[index]))
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
            'cartlist': {id: req.body.goodsid}
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

// 注册
router.post('/sign',async (req,res)=>{
    let {username,password} = req.body
    let userInfo = await User.findOne({username})
    if(userInfo){
        // 已注册过
        responseData.code = 3
        responseData.message = '用户名已被注册'
        res.json(responseData)
    }else{
        // 未注册
        let user = new User(req.body)
        user.save().then(userRes=>{
            // 注册成功
            responseData.code = 0
            responseData.message = '注册成功'
            res.json(responseData)
        })
    }
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
    let {city,province,county,addressDetail,isDefault} = req.body.address
    req.body.address.address = city==province ? city+county+addressDetail : city+province+county+addressDetail
    if(isDefault){
        await User.updateOne({
            username: req.body.username,
            'address.isDefault': true
        },{
            '$set': {
                'address.$[].isDefault': false
            }
        })
    }
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

// 编辑地址
router.get('/address/:_id',async (req,res)=>{
    let addInfo = await User.findOne({
        'address._id': req.params._id
    },{
        'address.$': req.params._id
    })
    responseData.code = 0
    responseData.message = '查询地址成功'
    responseData.data = addInfo
    res.json(responseData)
})

router.put('/address/:_id',async(req,res)=>{
    // 增加详细地址字段address
    let {city,province,county,addressDetail,isDefault} = req.body.address
    req.body.address.address = city==province ? city+county+addressDetail : city+province+county+addressDetail
    if(isDefault){
        await User.updateOne({
            username: req.body.username,
            'address.isDefault': true
        },{
            '$set': {
                'address.$.isDefault': false
            }
        })
    }
    let result = await User.updateOne({
        username: req.body.username,
        'address._id': req.params._id
    },{
        '$set': {
            'address.$': req.body.address
        }
    })
    if(result){
        let userInfo = await User.findOne({username: req.body.username})
        responseData.code = 0
        responseData.message = '编辑成功'
        responseData.data = userInfo.address
    }else{
        responseData.code = 2
        responseData.message = '编辑失败'
    }
    res.json(responseData)
})

// 分类列表
router.get('/sort',async (req,res)=>{
    let {choose,rank,sales} = req.query
    choose = JSON.parse(choose)
    let reg = new RegExp(choose.fun)
    // 分类查询条件
    let query = Object.assign({},choose,{fun: {$regex: reg}})
    // 价格排序
    let rankMap = {
        default: {},
        desc: {price: -1},
        asc: {price: 1}
    }
    // 销量，评论排序
    let salesMap = {
        default: {},
        sales: {sales: -1},
        bbs: {bbs: -1}
    }
    // 合并排序
    let sortMap = Object.assign({},rankMap[rank],salesMap[sales])
    let goodsInfo = await Goods.find(query).sort(sortMap)
    if(goodsInfo.length>0){
        responseData.message = '查询到数据'
        responseData.data = goodsInfo
    }else{
        responseData.message = '暂无数据'
        responseData.data = []
    }
    responseData.code = 0
    res.json(responseData)
})

module.exports = router
