const express = require('express')
const router = express.Router()
const Goods = require('../models/Goods')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
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
router.get('/goods',async (req,res)=>{
    let goodslist = await Goods.find({})
    if(goodslist.length>0){
        responseData.code = 0
        responseData.message = '查询所有商品'
        responseData.data = goodslist
    }else{
        responseData.code = 2
        responseData.message = '暂无商品'
    }
    res.json(responseData)
})

// 获取商品详情
router.get('/goods/:_id',async (req,res)=>{
    let {_id} = req.params
    let goodsInfo = await Goods.findOne({_id})
    if(goodsInfo){
        responseData.code = 0
        responseData.message = '查询商品详情'
        responseData.data = goodsInfo
    }else{
        responseData.code = 2
        responseData.message = '查询失败'
    }
    res.json(responseData)
})

// 添加商品
router.post('/goods',async (req,res)=>{
    let {name} = req.body
    let goodsInfo = await Goods.findOne({name})
    if(goodsInfo){
        // 数据库中已有该型号商品
        responseData.code = 4
        responseData.message = '已有相同型号商品'
        res.json(responseData)
        return
    }
    // 保存商品
    let goods = new Goods(req.body)
    let newGoodsInfo = await goods.save()
    if(newGoodsInfo){
        responseData.code = 0
        responseData.message = '添加商品成功'
        res.json(responseData)
    }
})

// 添加收藏
router.post('/fav',async (req,res)=>{
    let {username,goodsid} = req.body
    let favRes = await User.updateOne({
        username
    },{
        '$addToSet': {
            favlist: goodsid
        }
    })
    if(favRes.nModified){
        // 添加成功,返回收藏数据
        let userInfo = await User.findOne({username})
        if(userInfo){
            responseData.code = 0
            responseData.message = '收藏成功'
            responseData.data = userInfo.favlist
        }else{
            responseData.code = 2
            responseData.message = '收藏失败'
        }
        res.json(responseData)
    }else{
        // 已收藏过，取消收藏
        let chanceRes = await User.updateOne({
            username
        },{
            '$pull': {
                favlist: goodsid
            }
        })
        if(chanceRes.nModified){
            let userInfo = await User.findOne({username})
            if(userInfo){
                responseData.code = 0
                responseData.message = '取消收藏'
                responseData.data = userInfo.favlist
            }else{
                responseData.code = 2
                responseData.message = '取消失败'
            }
            res.json(responseData)
        }
    }
})

// 获取用户信息
router.get('/user',async (req,res)=>{
    let {username} = req.query
    let userInfo = await User.findOne({username})
    if(userInfo){
        responseData.code = 0
        responseData.message = '查询成功'
        responseData.data = userInfo
    }else{
        responseData.code = 2
        responseData.message = '查询失败'
    }
    res.json(responseData)
})

// 获取收藏商品列表详情
router.get('/fav',async (req,res)=>{
    let {favlist} = req.query
    let favInfo = await Goods.find({
        _id: {$in: favlist}
    })
    if(favInfo.length>0){
        responseData.code = 0
        responseData.message = '查询收藏信息'
        responseData.data = favInfo
    }else{
        responseData.code = 2
        responseData.message = '暂无收藏信息'
    }
    res.json(responseData)
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
            username,
            'cartlist.id':  goodsid
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
        let userInfo = await User.findOne({username})
        if(userInfo){
            responseData.code = 0
            responseData.message = '添加成功'
            responseData.data = userInfo.cartlist
        }else{
            responseData.code = 2
            responseData.message = '添加失败'
        }
        res.json(responseData)
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
    let {username,cartlist} = req.query
    if(cartlist.startsWith('[')){
        // 购物车获取
        let userInfo = await User.findOne({
            username,
            'cartlist.id':  {$in:JSON.parse(cartlist)}
        })
        let cartInfo = await Goods.find({
            _id: {$in:JSON.parse(cartlist)}
        })
        // 合并购物车商品详细数据
        let mergeInfo = []
        cartInfo.forEach(item=>{
            userInfo.cartlist.forEach(value=>{
                if(item._id==value.id){
                    mergeInfo.push({
                        ...item._doc,
                        num: value.num
                    })
                }
            })
        })
        responseData.code = 0
        responseData.message = '查询购物车信息成功'
        responseData.data = mergeInfo
        res.json(responseData)
    }else{
        // 单个商品购买获取
        let cartInfo = await Goods.find({
            _id: cartlist
        })
        let resInfo = []
        cartInfo.forEach(item=>{
            resInfo.push({
                ...item._doc,
                num: 1
            })
        })
        responseData.code = 0
        responseData.message = '查询商品信息'
        responseData.data = resInfo
        res.json(responseData)
    }
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
    if(result.nModified){
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
        let userRes = await user.save()
        if(userRes){
            // 注册成功
            responseData.code = 0
            responseData.message = '注册成功'
        }else{
            // 注册失败
            responseData.code = 2
            responseData.message = '注册失败'
        }
        res.json(responseData)
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
        responseData.code = 0
        responseData.message = '查询到数据'
        responseData.data = goodsInfo
    }else{
        responseData.code = 1
        responseData.message = '暂无数据'
        responseData.data = []
    }
    res.json(responseData)
})

// 提交订单
router.post('/order',async (req,res)=>{
    let {username,totalPrice,cartlistid,num,name,tel,address,couponId,couponPrice,score} = req.body
    // 更新优惠券，积分，余额
    let couponRes = await User.updateOne({username},{
        '$pull': {
            coupons: couponId
        },
        '$inc': {
            score: + Math.floor(totalPrice/100) - score,
            balance: - (totalPrice - couponPrice)
        }
    })
    // 更新商品销量数据
    let cartlist = cartlistid.startsWith('[') ? JSON.parse(cartlistid) : JSON.parse(`["${cartlistid}"]`)
    let salesRes = await Goods.updateMany({
        _id: {$in: cartlist}
    },{
        '$set': {
            sales: num
        }
    })
    if(couponRes.ok && salesRes.ok){
        let userInfo = await User.findOne({username})
        // 更新用户订单数据
        userInfo.order.push({
            pid: cartlistid,
            totalPrice,
            num,
            name,
            tel,
            address,
            couponPrice
        })
        // 更新用户积分列表数据
        userInfo.scorelist.push({
            num: Math.floor(totalPrice/100),
            date: new Date(new Date().toLocaleDateString()).getTime(),
            title: '购买商品奖励积分',
            orderId: userInfo.order[userInfo.order.length-1]._id
        })
        let userInfoNew = await userInfo.save()
        if(userInfoNew){
            responseData.code = 0
            responseData.message = `购买成功，此单返还${Math.floor(totalPrice/100)}积分`
            responseData.data = {
                balance: userInfoNew.balance,
                coupons: userInfoNew.coupons,
                score: userInfoNew.score
            }
        }else{
            responseData.code = 2
            responseData.message = '购买失败'
        }
        res.json(responseData)
    }
})

// 订单列表
router.get('/order',async (req,res)=>{
    let userInfo = await User.findOne({username:req.query.username})
    let order = userInfo.order || []
    // 通过订单列表中商品id获取商品详情
    let getGoodsInfo = async ()=>{
        let arr = []
        // 循环订单列表异步获取商品表中商品名称和图片地址
        let allPromise = order.map(item=>{
            return new Promise(async (resolve,reject)=>{
                let pid = item.pid.startsWith('[') ? JSON.parse(item.pid) : JSON.parse(`["${item.pid}"]`)
                let goodsInfo = await Goods.find({
                    _id: {$in:pid}
                })
                let pname = []
                let pic = []
                goodsInfo.forEach(value=>{
                    pname.push(value.name)
                    pic.push(value.pic)
                })
                let data = Object.assign({},item._doc,{pname,pic})
                arr.push(data)
                resolve(arr)
            })
        })
        await Promise.all(allPromise)
        return arr
    }
    let goodsInfo = await getGoodsInfo()
    if(goodsInfo.length>0){
        responseData.code = 0
        responseData.message = '查询成功'
        responseData.data = goodsInfo
    }else{
        responseData.code = 2
        responseData.message = '查询失败'
    }
    res.json(responseData)
})

// 获取优惠券列表
router.get('/coupon',async (req,res)=>{
    let {sortlist,coupons,getCoupons} = req.query
    coupons = JSON.parse(coupons)
    if(sortlist){
        let couponslist = await Coupon.find({
            _id: {$in:coupons}
        })
        sortlist = JSON.parse(sortlist)
        let enable = []     // 可使用优惠券列表
        let disable = []    // 不可使用优惠券列表
        couponslist.forEach((item,index)=>{
            sortlist.forEach(value=>{
                if(item.condition.includes(value)||item.condition=='无使用门槛'){
                    if(!enable.includes(item)) enable.push(item)
                    couponslist.splice(index,1,'')
                }
            })
        })
        couponslist.forEach(item=>{
            if(item) disable.push(item)
        })
        responseData.code = 0
        responseData.message = '查询成功'
        responseData.data = {enable,disable}
        res.json(responseData)
    }else{
        if(getCoupons){
            // 领取优惠券
            let getCouponslist = await Coupon.find({})
            getCouponslist.forEach(item=>{
                coupons.forEach(value=>{
                    if(item._id==value){
                        item._doc.geted = true
                    }
                })
            })
            if(getCouponslist.length>0){
                responseData.code = 0
                responseData.message = '查询成功'
                responseData.data = getCouponslist
            }else{
                responseData.code = 2
                responseData.message = '暂无数据'
            }
            res.json(responseData)
        }else{
            // 我的优惠券列表
            let myCouponslist = await Coupon.find({
                _id: {$in:coupons}
            })
            if(myCouponslist.length>0){
                responseData.code = 0
                responseData.message = '查询成功'
                responseData.data = myCouponslist
            }else{
                responseData.code = 2
                responseData.message = '暂无数据'
            }
            res.json(responseData)
        }
    }
})

// 领取优惠券
router.post('/coupon',async (req,res)=>{
    let {username,couponId} = req.body
    let userRes = await User.updateOne({
        username
    },{
        '$addToSet': {
            coupons: couponId
        }
    })
    if(userRes.ok){
        responseData.code = 0
        responseData.message = '领取成功'
    }else{
        responseData.code = 2
        responseData.message = '领取失败'
    }
    res.json(responseData)
})

// 获取我的足迹
router.get('/footprint', async (req,res)=>{
    let {footprint} = req.query
    let footInfo = await Goods.find({
        _id: {$in: footprint}
    })
    if(footInfo.length>0){
        responseData.code = 0
        responseData.message = '查询足迹信息'
        responseData.data = footInfo
    }else{
        responseData.code = 2
        responseData.message = '无足迹信息'
    }
    res.json(responseData)
})

// 添加我的足迹
router.post('/footprint',async (req,res)=>{
    let {username,pid} = req.body
    let footRes = await User.updateOne({
        username
    },{
        '$addToSet': {
            footprint: pid
        }
    })
    if(footRes.ok){
        // 添加成功,返回足迹数据
        let userInfo = await User.findOne({username})
        responseData.code = 0
        responseData.message = '添加成功'
        responseData.data = userInfo.footprint
        res.json(responseData)
    }else{
        // 已添加过
        responseData.code = 2
        responseData.message = '已添加过'
        res.json(responseData)
    }
})

// 删除足迹中商品
router.delete('/footprint',async (req,res)=>{
    let {username,delFootlist} = req.body
    let footRes = await User.updateOne({
        username
    },{
        '$pull': {
            'footprint': {$in: delFootlist}
        }
    })
    if(footRes.ok){
        // 删除成功
        let userInfo = await User.findOne({username})
        responseData.code = 0
        responseData.message = '删除成功'
        responseData.data = userInfo.footprint
    }else{
        // 删除失败
        responseData.code = 2
        responseData.message = '删除失败'
    }
    res.json(responseData)
})

// 签到
router.post('/signin',async (req,res)=>{
    let {username,time,score} = req.body
    let startTime = new Date(new Date().toLocaleDateString()).getTime()
    let endTime = new Date(new Date(new Date().toLocaleDateString()).getTime()+24*60*60*1000-1).getTime()
    let signinTime = await User.findOne({username})
    let signinFn = async ()=>{
        let signinRes = await User.updateOne({username},{
            '$set': {
                signin: time
            },
            '$inc': {
                score: + score
            }
        })
        if(signinRes.ok){
            // 更新用户积分列表数据
            signinTime.scorelist.push({
                num: score,
                date: new Date(new Date().toLocaleDateString()).getTime(),
                title: '签到奖励积分'
            })
            signinTime.save()
            responseData.code = 0
            responseData.message = `签到成功,获得${score}积分`
            res.json(responseData)
        }
    }
    if(!signinTime.signin){
        // 第一次签到
        signinFn()
    }else{
        if(signinTime.signin>startTime&&signinTime.signin<endTime){
            // 已签到
            responseData.code = 2
            responseData.message = '今天已经签过到了，明天再签到吧'
            res.json(responseData)
        }else{
            // 未签到
            signinFn()
        }
    }
})

// 礼物
router.post('/gift',async (req,res)=>{
    let {username,gift} = req.body
    let giftRes = await User.updateOne({
        username
    },{
        '$inc': {
            balance: + gift
        }
    })
    if(giftRes.ok){
        responseData.code = 0
        responseData.message = '领取成功'
        res.json(responseData)
    }
})

// 积分列表
router.get('/score',async (req,res)=>{
    let {username} = req.query
    let userInfo = await User.findOne({username})
    if(userInfo.scorelist.length>0){
        responseData.code = 0
        responseData.message = '查询成功'
        responseData.data = userInfo.scorelist
    }else{
        responseData.code = 2
        responseData.message = '暂无积分记录'
    }
    res.json(responseData)
})

module.exports = router
