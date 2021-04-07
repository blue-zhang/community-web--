import { PostModel, UpdateModel } from '@/model/Post'
import { getPayload } from '../common/utils'
// import fs from 'fs-extra'
// import config from '@/config/index'
import { UserModel } from '@/model/User'
import { CommentsModel } from '@/model/Comments'
import { ReplyModel } from '@/model/Reply'
import { CommentsHandsModel } from '@/model/CommentsHands'
import { PostHandsModel } from '@/model/PostHands'
import { Col_infoModel } from '@/model/Col_info'
import { praise_hand } from '@/common/utils'
class ContentController {
  async getList (ctx) {
    // const test = new PostModel({
    //   uid: '6035cc8cc326c662147b08b5',
    //   isPost: true,
    //   title: 'content',
    //   picUrl: '',
    //   content: 'qweqweqweqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    //   catalog: 'advise',
    //   favs: 100,
    //   isEnd: '0',
    //   answer: 10,
    //   stars: 10,
    //   reads: 10,
    //   hands: 123,
    //   status: '0',
    //   isTop: '0',
    //   tags: [
    //     {
    //       name: '精华',
    //       class: 'bg-blue'
    //     }
    //   ]
    // })
    // await test.save()

    const body = ctx.query
    // 默认按热议排序
    const sort = body.sort ? body.sort : 'answer'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    const options = {}
    options.isPost = true
    if (body.catalog && body.catalog !== 'index') {
      options.catalog = body.catalog
    }
    if (body.isTop) {
      options.isTop = body.isTop
    }
    if (body.isEnd) {
      options.isEnd = body.isEnd
    }
    if (body.tag) {
      // 此处将options.tags定义为了一种内嵌查询操作符，作为find（）的参数
      options.tags = { $elemMatch: { name: body.tag } }
    }
    let result = await PostModel.getList(options, page, limit, sort)
    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      result = result.map((item) => item.toJSON()
      )
      await praise_hand(result, obj._id)
    }

    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
    }
  }

  // 登录后获取列表
  async getListLogin (ctx) {
    // const test = new PostModel({
    //   uid: '6052b568e99a5068c42a883f',
    //   isPost: true,
    //   title: '中华民族伟大复兴',
    //   picUrl: '',
    //   content: '中华民族伟大复兴是中国共产党1997年召开的中共十五大提出的执政理念，取代先前的“振兴中华”理念。2002年中共十六大，胡锦涛就任中国共产党中央委员会总书记以后对其内容加以发展。2012年中共十八大，习近平就任中共中央总书记后在此基础时提出中国梦构想。',
    //   catalog: 'share',
    //   favs: 100,
    //   isEnd: '0',
    //   status: '0',
    //   answer: 10,
    //   stars: 10,
    //   reads: 10,
    //   hands: 123,
    //   isTop: '0',
    //   tags: [
    //     {
    //     }
    //   ]
    // })
    // await test.save()
    const body = ctx.query
    // 默认按热议排序
    const sort = body.sort ? body.sort : 'answer'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    const options = {}
    options.isPost = true
    if (body.catalog && body.catalog !== 'index') {
      options.catalog = body.catalog
    }
    if (body.isTop) {
      options.isTop = body.isTop
    }
    if (body.isEnd) {
      options.isEnd = body.isEnd
    }
    if (body.tag) {
      // 此处将options.tags定义为了一种内嵌查询操作符，作为find（）的参数
      options.tags = { $elemMatch: { name: body.tag } }
    }
    let result = await PostModel.getList(options, page, limit, sort)
    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      result = result.map((item) => item.toJSON()
      )
      await praise_hand(result, obj._id)
    }
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
    }
  }

  async getWeekTop (ctx) {
    const result = await PostModel.getWeekTop()
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取本周热议成功'
    }
  }

  // 保存新的草稿箱
  async saveDrafts (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { content, title, picUrl } = ctx.request.body
    // created 在 pre 中保存
    const drafts = new PostModel({
      uid: obj._id,
      title,
      content,
      picUrl
    })
    const data = await drafts.save()
    if (data) {
      ctx.body = {
        code: 200,
        msg: '草稿保存成功',
        pid: data._id
      }
    }
  }

  // 更新草稿内容
  async updateDrafts (ctx) {
    const { content, title, picUrl, pid } = ctx.request.body
    if (!pid) {
      ctx.body = {
        code: 410,
        msg: '草稿不存在或已删除'
      }
      return
    }
    const lists = await PostModel.updateOne({ _id: pid, isPost: false }, {
      $set: {
        title,
        content,
        picUrl
      }
    })

    if (lists.n === 1 && lists.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '更新草稿成功'
      }
    } else {
      ctx.body = {
        code: 410,
        msg: '草稿不存在或已删除'
      }
    }
  }

  // 获取草稿
  async getDrafts (ctx) {
    const type = ctx.query.type
    if (type === '') {
      // 草稿箱获取全部草稿列表, 排除 isPost === true 的
      const obj = await getPayload(ctx.header.authorization)
      const lists = await PostModel.find({ uid: obj._id, isPost: false }).sort({ updated: -1 })
      if (lists) {
        ctx.body = {
          code: 200,
          msg: '获取草稿成功',
          data: lists
        }
      }
    } else if (type === 'last') {
      // 从草稿箱路由切换到编辑页面时发送的请求
      const obj = await getPayload(ctx.header.authorization)
      const lists = await PostModel.findOne({ uid: obj._id, isPost: false }).sort({ updated: -1 })
      if (lists) {
        ctx.body = {
          code: 200,
          msg: '获取上次保存草稿成功',
          data: lists
        }
      } else {
        ctx.body = {
          code: 404,
          msg: '您的草稿箱的内容为空'
        }
      }
    } else {
      // 获取草稿的id, 更新草稿时间
      const newCreated = new Date()
      const obj = await getPayload(ctx.header.authorization)
      await PostModel.updateOne({ uid: obj._id, _id: type, isPost: false }, { $set: { updated: newCreated } })
      // 使用 id 查询，不用 created

      const lists = await PostModel.findOne({ uid: obj._id, _id: type, isPost: false })
      if (lists) {
        ctx.body = {
          code: 200,
          msg: '获取草稿成功',
          data: lists
        }
      }
    }
  }

  // 删除草稿
  async delDrafts (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { id } = ctx.request.body
    const lists = await PostModel.deleteOne({ uid: obj._id, _id: id, isPost: false })

    if (lists.n === 1 && lists.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除草稿成功'
      }
    }
  }

  // 提交文章, 手动更新文章的 updated 属性
  // 内容这是作为 post 被创建，而不是 draft, 前端排序的时候，查询 updated，因为文章可能被更改。
  async submitPost (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { title, content, picUrl, catalog, favs, id } = ctx.request.body
    const newCreated = new Date()
    // 提交文章后减少 favs，回答被采纳的用户增加 favs
    const userUpdate = await UserModel.updateOne({ _id: obj._id }, { $inc: { favs: -favs } })
    const update = await PostModel.updateOne({ uid: obj._id, _id: id }, { $set: { updated: newCreated, isPost: true, title, content, picUrl, catalog, favs } })
    if (update.ok === 1 && update.ok === 1) {
      if (userUpdate.ok === 1 && userUpdate.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '发帖成功'
        }
      }
    }
  }

  // 获取文章详情
  async getDetail (ctx) {
    const pid = ctx.query.pid
    if (!pid) {
      ctx.body = {
        code: 410,
        msg: '文章id为空'
      }
      return
    }
    let res = await await PostModel.findByPid(pid)
    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      res = res.toJSON()
      // 判断是否点赞过
      const praise = await PostHandsModel.findOne({ pid, uid: obj._id })
      res.handed = '0'
      if (praise) {
        res.handed = '1'
      }
      // 判断是否收藏过
      const data = await Col_infoModel.find({ pid, uid: obj._id })
      res.collected = data.length !== 0 ? '1' : '0'
      // 增加阅读数
      await PostModel.updateOne({ _id: pid, isPost: true }, { $inc: { reads: 1 } })
    }
    ctx.body = {
      code: 200,
      msg: '获取文章详情成功',
      data: res
    }
  }

  // 增加阅读数
  async incReads (ctx) {
    const { pid } = ctx.query
    const update = await PostModel.updateOne({ _id: pid, isPost: true }, { $inc: { reads: 1 } })
    if (update.ok === 1) {
      ctx.body = {
        code: 200
      }
    }
  }

  // 帖子更新没发表，下次更新的时候，从后端获取数据
  async loadUpdate (ctx) {
    const pid = ctx.query.pid
    const find = await UpdateModel.findOne({ pid })
    if (find) {
      ctx.body = {
        code: 200,
        data: find
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '后端没有更新记录'
      }
    }
  }

  // 修改已发表文章
  async updatePost (ctx) {
    const { pid, content, title, picUrl } = ctx.request.body
    const find = await UpdateModel.findOne({ pid })
    if (find) {
      const res = await UpdateModel.updateOne({ pid }, { $set: { content, title, picUrl } })
      if (res.n === 1 && res.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '更新文章已保存'
        }
      }
    } else {
      const data = new UpdateModel({
        pid, content, title, picUrl
      })
      const res = data.save()
      if (res) {
        ctx.body = {
          code: 200,
          msg: '更新文章以保存'
        }
      }
    }
  }

  // 提交更新修改
  async submitUpdate (ctx) {
    const { pid } = ctx.request.body
    const find = await UpdateModel.findOne({ pid })
    if (find) {
      const update = await PostModel.updateOne({ _id: pid, isPost: true }, { $set: { content: find.content, title: find.title, picUrl: find.picUrl } })
      if (update.n === 1 && update.ok === 1) {
        await UpdateModel.deleteOne({ pid })
        ctx.body = {
          code: 200,
          pid: pid,
          msg: '更新成功'
        }
      } else {
        ctx.body = {
          code: 410,
          pid: pid,
          msg: '更新失败'
        }
      }
    } else {
      // find 为 null, 说明用户没有进行更改，则不做任何操作返回更新成功
      ctx.body = {
        code: 200,
        pid: pid,
        msg: '更新成功'
      }
    }
  }

  // 文章点赞
  async handPost (ctx) {
    const { pid, postAuth } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const isPraised = await PostHandsModel.getHandsByUidPid({ pid, uid: obj._id })
    if (!isPraised) {
      // 用户没有点赞过
      const model = new PostHandsModel({
        pid, uid: obj._id, postAuth
      })
      const save = model.save()
      const update = await PostModel.findOneAndUpdate({ _id: pid, isPost: true }, { $inc: { hands: 1 } }, { new: true })
      if (save && update) {
        ctx.body = {
          code: 200,
          msg: '点赞成功',
          hands: update.hands,
          isPraised: '1'
        }
      }
    } else {
      // 用户已经赞过，删除点赞
      const del = await PostHandsModel.deleteOne({ pid, uid: obj._id })
      const update = await PostModel.findOneAndUpdate({ _id: pid, isPost: true }, { $inc: { hands: -1 } }, { new: true })
      if (del.ok === 1 && update) {
        ctx.body = {
          code: 201,
          msg: '取消点赞成功',
          hands: update.hands,
          isPraised: '0'
        }
      }
    }
  }

  async delPost (ctx) {
    // const obj = await getPayload(ctx.header.authorization)
    const { pid } = ctx.request.body
    await UpdateModel.deleteOne({ pid })
    // 删除评论点赞
    await CommentsHandsModel.delByPid(pid)
    // 删除文章点赞
    await PostHandsModel.delByPid(pid)
    await CommentsModel.delByPid(pid)
    await ReplyModel.delByPid(pid)
    await Col_infoModel.delByPid(pid)
    const res = await PostModel.delById(pid)
    if (res.n === 1 && res.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除文章成功'
      }
    }
  }

  // 获取用户发的所有的帖子
  async userPost (ctx) {
    let { limit, page, uid } = ctx.query
    limit = parseInt(limit)
    page = parseInt(page)
    let data = await PostModel.getPost(uid, limit, page)
    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      data = data.map((item) => item.toJSON()
      )
      await praise_hand(data, obj._id)
    }
    const total = await PostModel.countByUid(uid)
    ctx.body = {
      code: 200,
      msg: '获取用户发帖列表成功',
      data,
      total
    }
  }

  // 获取用户的提问
  async userQuestion (ctx) {
    let { limit, page, uid } = ctx.query
    limit = parseInt(limit)
    page = parseInt(page)
    let data = await PostModel.getQuestion(uid, limit, page)
    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      data = data.map((item) => item.toJSON()
      )
      await praise_hand(data, obj._id)
    }
    const total = await PostModel.countAsk(uid)
    ctx.body = {
      code: 200,
      msg: '获取用户发帖列表成功',
      data,
      total
    }
  }
}

export default new ContentController()
