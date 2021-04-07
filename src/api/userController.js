import { SignModel } from '../model/Sign'
import { getPayload } from '../common/utils'
import { UserModel } from '@/model/User'
import { ReplyModel } from '@/model/Reply'
import { CommentsModel } from '@/model/Comments'
import { CommentsHandsModel } from '@/model/CommentsHands'
import { PostHandsModel } from '@/model/PostHands'
import { PostModel } from '@/model/Post'
import { AttentionModel } from '@/model/Attention'
import moment from 'dayjs'
import config from '@/config/index'
import uuid from 'uuid'
import make_dir from 'make-dir'
import { praise_hand } from '@/common/utils'
import fs from 'fs-extra'

class SignController {
  // 签到接口, favs 是用户的总积分
  async getSign (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const user = await UserModel.findByID(obj._id)
    // 获取最新签到记录
    const sign = await SignModel.findByUid(obj._id)
    // 每次签到，创建一个新的签到文档
    let newSign = {}
    let result = {}
    if (sign) {
      // 存在签到记录，判断是否已经签到，前端也要锁死
      if (moment(sign.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        ctx.body = {
          code: 500,
          msg: '今天已经签到了',
          count: user.count,
          favs: user.favs
        }
        return
      }
      // 存在签到记录，判断上一次是否签到
      if (moment(sign.created).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
        // 上一次签到，则count+1
        const count = user.count + 1
        let favs = 5
        if (count <= 15 && count > 5) {
          favs = 10
        } else if (count <= 30 && count > 15) {
          favs = 15
        } else if (count <= 100 && count > 30) {
          favs = 20
        } else if (count <= 200 && count > 100) {
          favs = 30
        } else if (count > 200) {
          favs = 45
        }
        newSign = new SignModel({
          favs,
          uid: obj._id
        })
        await newSign.save()
        await UserModel.updateOne(
          { _id: obj._id },
          {
            $inc: { favs: favs, count: 1 },
            $set: { lastSign: newSign.created }
          }
        )
        result = {
          favs: user.favs + favs,
          count: user.count + 1,
          created: newSign.created
        }
      } else {
        // 上一次没签到，则count=1,favs=5，favs累加, 更新user
        newSign = new SignModel({
          favs: 5,
          uid: obj._id
        })
        await newSign.save()
        await UserModel.updateOne(
          { _id: obj._id },
          {
            $inc: { favs: 5 },
            $set: { count: 1, lastSign: newSign.created }
          }
        )
        result = {
          favs: user.favs + 5,
          count: 1,
          created: newSign.created
        }
      }
    } else {
      // 保存一个新的签到文档
      newSign = new SignModel({
        favs: 5,
        uid: obj._id
      })
      await newSign.save()
      // 没有签到记录，则count=1,favs=5，favs累加, 更新user
      await UserModel.updateOne(
        { _id: obj._id },
        {
          $inc: { favs: 5 },
          $set: { count: 1, lastSign: newSign.created }
        }
      )
      result = {
        favs: user.favs + 5,
        count: 1,
        created: newSign.created
      }
    }
    ctx.body = {
      code: 200,
      msg: '签到成功',
      ...result
    }
  }

  // 修改基本信息
  async changeBasic (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { fakename, birthday, location, gender, regmark } = ctx.request.body
    const update = await UserModel.updateOne({ _id: obj._id }, {
      $set: {
        fakename, birthday, location, gender, regmark
      }
    })
    if (update.n === 1 && update.ok === 1) {
      const result = {
        fakename,
        birthday,
        location,
        gender,
        regmark
      }
      ctx.body = {
        code: 200,
        msg: '用户信息更新成功',
        result
      }
    } else {
      // 更新失败，使用之前数据库的内容返回
      const userInfo = await UserModel.findOne({ _id: obj._id })
      const result = {
        fakename: userInfo.fakename,
        birthday: userInfo.birthday,
        location: userInfo.location,
        gender: userInfo.gender,
        regmark: userInfo.regmark
      }
      ctx.body = {
        code: 500,
        msg: '用户信息更新失败',
        result
      }
    }
  }

  // 更新头像，前端先通过uploadImg上传图片，再更新数据库内对应用户的头像信息
  async changePic (ctx) {
    const { pic } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization)
    const update = await UserModel.updateOne({ _id: obj._id }, { $set: { pic: pic } })
    if (update.n === 1 && update.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '修改头像成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '修改头像失败，请稍后再试'
      }
    }
  }

  // 上传图片
  async uploadImg (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const uid = obj._id
    const type = ctx.query.type
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    // 返回到前端的路径，koa-static中设置public路径，所以不包含public
    let filePath = ''
    let dir = ''
    const picname = uuid()
    if (type === 'headPic') {
      // 上传新的头像的时候，删除原来的头像
      // await fs.remove(`${config.uploadPath}/${uid}/headPic`, (e) => {
      //   console.log(e)
      // })
      dir = `${config.uploadPath}/${uid}/headPic`
      filePath = `${uid}/headPic/${picname}.${ext}`
    } else if (type === 'postPic') {
      const pid = ctx.query.pid
      dir = `${config.uploadPath}/${uid}/${pid}`
      filePath = `${uid}/${pid}/${picname}.${ext}`
    }
    // 以日期为依据创建储存图片的文件夹
    // const dir = `${config.uploadPath}/${moment().format('YYYYMMDDHH')}`
    // 判断路径是否存在，不存在则创建
    await make_dir(dir)
    const destPath = `${dir}/${picname}.${ext}`
    // 同步操作，获取文件大小
    // const stat = fs.statSync(file.path)
    // console.log('uploadImg -> stat', stat.size)
    // highWaterMark默认64kb
    const readerStream = fs.createReadStream(file.path)
    const writerStream = fs.createWriteStream(destPath)
    // 方法1：管道读取操作，简单
    // readerStream.pipe(writerStream)
    // 方法2：适合大文件
    readerStream.on('data', (chunk) => {
      if (writerStream.write(chunk) === false) {
        readerStream.pause()
      }
    })
    writerStream.on('drain', () => {
      readerStream.resume()
    })
    readerStream.on('end', () => {
      writerStream.end()
    })
    ctx.body = {
      code: 200,
      msg: '上传图片成功',
      path: filePath
    }
  }

  // 获取用户主页的信息
  async getUserInfo (ctx) {
    const { uid } = ctx.query
    const data = await UserModel.findOne({ _id: uid }, { password: 0, email: 0, mobile: 0 })
    if (data) {
      ctx.body = {
        code: 200,
        data: data
      }
    }
  }

  // 获取用户的回复信息
  async getUserReply (ctx) {
    let { page, limit } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    const obj = await getPayload(ctx.header.authorization)
    const { lists, total } = await ReplyModel.getUserReply(obj._id, page, limit)
    const unread = await ReplyModel.getUnread(obj._id)
    ctx.body = {
      code: 200,
      data: lists,
      total,
      unread
    }
  }

  // 获取用户文章评论信息
  async getPostComment (ctx) {
    let { page, limit } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    const obj = await getPayload(ctx.header.authorization)
    const { lists, total } = await CommentsModel.getUserComment(obj._id, page, limit)
    const unread = await CommentsModel.getUnread(obj._id)
    ctx.body = {
      code: 200,
      data: lists,
      total,
      unread
    }
  }

  // 获取评论, 回复的点赞，整合点赞数据
  async getCommentHands (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    let { page, limit } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    const data = await CommentsHandsModel.getCommentsHands(obj._id)

    const lists = new Map()
    let result = []
    // 相同评论下的数据进行合并
    data.forEach((item) => {
      // item.fakename = [item.fakename]
      item.fakename = [{
        fakename: item.fakename,
        uid: item.uid
      }]
      if (lists.has(item.cid)) {
        const data = lists.get(item.cid)
        data.fakename.push(item.fakename[0])
      } else {
        lists.set(item.cid, item)
      }
    })
    const total = lists.size
    for (const [key, value] of lists) {
      value.cid = key
      result.push(value)
    }
    if (total > limit) {
      result = result.splice(page * limit, limit)
    }
    const unread = await CommentsHandsModel.getUnread(obj._id)
    ctx.body = {
      code: 200,
      data: result,
      total,
      unread
    }
  }

  // 获取文章点赞
  async getPostHands (ctx) {
    let { page, limit } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    const obj = await getPayload(ctx.header.authorization)
    // 返回的数据是按时间排序的
    let data = await PostHandsModel.getPostHands(obj._id)
    // 以文章id为key，按照点赞的时间进行的排序
    const lists = new Map()
    data = data.map((item) => item.toJSON())
    data.forEach((item) => {
      const arr = [{
        fakename: item.uid.fakename,
        uid: item.uid._id.toJSON()
      }]
      item.uid = arr
      if (lists.has(item.pid._id.toJSON())) {
        const data = lists.get(item.pid._id.toJSON())
        data.uid.push(item.uid[0])
      } else {
        lists.set(item.pid._id.toJSON(), item)
      }
    })
    const total = lists.size
    let result = []
    for (const [key, value] of lists) {
      value.pid._id = key
      result.push(value)
    }
    if (total > limit) {
      result = result.splice(page * limit, limit)
    }
    const unread = await PostHandsModel.getUnread(obj._id)
    ctx.body = {
      code: 200,
      data: result,
      total,
      unread
    }
  }

  // 获取用户动态
  async activites (ctx) {
    let { page, limit, uid } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    // 我发的文章
    let post = await PostModel.find({ uid, isPost: true }).populate({
      path: 'uid',
      select: 'fakename pic isVip lv _id regmark catalog'
    })
    post = post.map((item) => item.toJSON())
    const postHand = await PostHandsModel.aggregate([
      { $match: { $expr: { $ne: ['$postAuth', uid] }, uid } },
      {
        $lookup: {
          from: 'posts',
          let: { opid: { $toObjectId: '$pid' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$opid'] } } },
            { $match: { isPost: true } },
            { $project: { content: 0 } }
          ],
          as: 'posts'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { ouid: { $toObjectId: '$postAuth' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$ouid'] } } },
            { $project: { _id: 1, fakename: 1, pic: 1, regmark: 1, lv: 1, isVip: 1 } }
          ],
          as: 'uid'
        }
      }
    ])
    // 我的点赞
    const praise = []
    postHand.forEach((item) => {
      const obj = item.posts[0]
      obj.uid = item.uid[0]
      obj.postAuth = item.postAuth
      obj.handed = '1'
      // 使用点赞信息的时间
      obj.created = item.created
      praise.push(obj)
    })
    // 我的关注
    const attention = await AttentionModel.find({ uid }).populate({ path: 'attention', select: '_id fakename pic isVip lv regmark' })
    let res = [...post, ...praise, ...attention]
    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      await praise_hand(res, obj._id)
    }
    res.sort(function (a, b) {
      return b.created.getTime() - a.created.getTime()
    })
    const total = res.length
    if (total > limit) {
      res = res.splice(page * limit, limit)
    }
    ctx.body = {
      code: 200,
      data: res,
      total
    }
  }

  // 获取作者关注
  async attentions (ctx) {
    let { page, limit, uid } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    const res = await AttentionModel.getAttention(uid, page, limit)
    if (res) {
      ctx.body = {
        code: 200,
        data: res
      }
    }
  }

  // 获取关注作者的
  async attentionsMe (ctx) {
    let { page, limit, uid } = ctx.query
    page = parseInt(page)
    limit = parseInt(limit)
    const res = await AttentionModel.getAttentionMe(uid, page, limit)
    if (res) {
      ctx.body = {
        code: 200,
        data: res
      }
    }
  }

  // 增加一个关注
  async addAttention (ctx) {
    const { attention, uid } = ctx.query
    const save = await AttentionModel.create({
      uid,
      attention
    })
    if (save) {
      ctx.body = {
        code: 200
      }
    }
  }

  // 取消一个关注
  async delAttention (ctx) {
    const { attention, uid } = ctx.query
    const del = await AttentionModel.delAttention(
      uid,
      attention
    )
    if (del) {
      ctx.body = {
        code: 200
      }
    }
  }

  // 进入别人主页判断是否关注了对方
  async isAttention (ctx) {
    const { attention, uid } = ctx.query
    const res = await AttentionModel.findOne({ uid, attention })
    if (res) {
      ctx.body = {
        code: 200,
        data: '1'
      }
    } else {
      ctx.body = {
        code: 200,
        data: '0'
      }
    }
  }

  // 清空通知信息
  async clearInfo (ctx) {
    const { type } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    let res
    const clear = {
      postCom: async (ctx) => {
        res = await CommentsModel.clearUnread(obj._id)
      },
      postHand: async (ctx) => {
        res = await PostHandsModel.clearUnread(obj._id)
      },
      comReply: async (ctx) => {
        res = await ReplyModel.clearUnread(obj._id)
      },
      comHand: async (ctx) => {
        res = await CommentsHandsModel.clearUnread(obj._id)
      }
    }
    await clear[type]()
    if (res.ok === 1) {
      ctx.body = {
        code: 200
      }
    }
  }
}
export default new SignController()
