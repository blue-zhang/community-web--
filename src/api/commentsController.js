import { CommentsModel } from '@/model/Comments'
import { ReplyModel } from '@/model/Reply'
import { PostModel } from '@/model/Post'
import { CommentsHandsModel } from '@/model/CommentsHands'

import { getPayload } from '../common/utils'

const getReplyLsInside = async (cid, page, limit, ctx) => {
  let data = await ReplyModel.getReplyList(cid, page, limit)
  // 登录后显示是否点赞
  if (ctx.header.authorization && data.length > 0) {
    const obj = await getPayload(ctx.header.authorization)
    data = data.map(item => item.toJSON())
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      item.handed = '0'
      const res = await CommentsHandsModel.findOne({ uid: obj._id, cid: item._id })
      if (res) {
        item.handed = '1'
      }
    }
  }
  return data
}
// 加载列表到 指定回复 显示出来
const getReplyLsInside_targetId = async (cid, page, limit, rid, ctx) => {
  let data = await ReplyModel.getReplyList(cid, page, limit)
  const continueLoad = (data) => {
    const stop = data.some((item) => {
      return item._id.toString() === rid
    })
    return !stop
  }
  while (continueLoad(data)) {
    page++
    const res = await ReplyModel.getReplyList(cid, page, limit)
    data = data.concat(res)
  }
  // 登录后显示是否点赞
  if (ctx.header.authorization && data.length > 0) {
    const obj = await getPayload(ctx.header.authorization)
    data = data.map(item => item.toJSON())
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      item.handed = '0'
      const res = await CommentsHandsModel.findOne({ uid: obj._id, cid: item._id })
      if (res) {
        item.handed = '1'
      }
    }
  }
  return { data, page }
}

class CommentsController {
  // 获取评论列表和回复列表
  async getCommentsLs (ctx) {
    const body = ctx.query
    const rid = body.rid
    const pid = body.pid
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 15
    let data = await CommentsModel.getCommentsList(pid, page, limit)
    // 登录后显示是否点赞
    if (ctx.header.authorization && data.length > 0) {
      const obj = await getPayload(ctx.header.authorization)
      data = data.map(item => item.toJSON())
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        item.handed = '0'
        const res = await CommentsHandsModel.findOne({ uid: obj._id, cid: item._id })
        if (res) {
          item.handed = '1'
        }
      }
    }
    const total = await CommentsModel.queryCount(pid)
    const replys = {}
    let targetId = ''
    // 回复被加载到那一页了
    let replyPage = 0
    // 判断是不是需要加载列表到指定回复显示出来
    if (rid) {
      // 根据回复 id，查询评论所在的文章评论的 cid
      targetId = await ReplyModel.findCid(rid)
      const res = await getReplyLsInside_targetId(targetId, 0, 15, rid, ctx)
      replys[targetId] = res.data
      replyPage = res.page
      for (let i = 0; i < data.length; i++) {
        if (data[i]._id.toString() !== targetId) {
          const reply = await getReplyLsInside(data[i]._id, 0, 15, ctx)
          if (reply.length > 0) {
            replys[data[i]._id] = reply
          }
        }
      }
    } else {
      // 加载每个评论里的第一页回复
      for (let i = 0; i < data.length; i++) {
        const reply = await getReplyLsInside(data[i]._id, 0, 15, ctx)
        if (reply.length > 0) {
          replys[data[i]._id] = reply
        }
      }
    }
    if (data) {
      ctx.body = {
        code: 200,
        data,
        total,
        replys,
        replyPage
      }
    }
  }

  // 提交评论
  async addComment (ctx) {
    const { content, pid } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization) // cuid
    const userObj = await PostModel.findByPid(pid) // 按文章 pid 查询到作者 id, uid._id
    const comments = new CommentsModel({
      content,
      pid,
      cuid: obj._id,
      uid: userObj.uid._id
    })
    const data = await comments.save()
    const update = await PostModel.incAnswer(pid, 1)
    // 消息记录
    if (data && update.ok === 1) {
      ctx.body = {
        code: 200,
        data
      }
    }
  }

  // 提交回复
  async submitReply (ctx) {
    const { content, cid, rid, ruid, pid } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization)
    const reply = new ReplyModel({
      content, cid, rid, ruid, rcuid: obj._id, pid
    })
    const save = await reply.save()
    const data = await ReplyModel.getReplyData(save._id)
    const update = await PostModel.incAnswer(pid, 1)
    // 消息记录
    if (data && update.ok === 1) {
      ctx.body = {
        code: 200,
        data
      }
    }
  }

  // 加载更多回复
  async getReplyLs (ctx) {
    const body = ctx.query
    const cid = body.cid
    const pid = body.pid
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 15
    let data = await ReplyModel.getReplyList(cid, page, limit)
    const total = await ReplyModel.countDoc(cid)
    // 登录后显示是否点赞

    if (ctx.header.authorization) {
      const obj = await getPayload(ctx.header.authorization)
      const res = await CommentsHandsModel.find({ uid: obj._id, pid })
      data = data.map(item => item.toJSON())
      data.forEach((com) => {
        if (res.some((item) => {
          return item.cid === com._id
        })) {
          com.handed = '1'
        } else {
          com.handed = '0'
        }
      })
      // const obj = await getPayload(ctx.header.authorization)
      // data = data.map(item => item.toJSON())
      // for (let i = 0; i < data.length; i++) {
      //   const item = data[i]
      //   item.handed = '0'
      //   const res = await CommentsHandsModel.findOne({ uid: obj._id, cid: item._id })
      //   if (res) {
      //     item.handed = '1'
      //   }
      // }
    }
    if (data) {
      ctx.body = {
        code: 200,
        data,
        total
      }
    }
  }

  // 点赞评论和回复, 重复点赞由前端限制
  async handComments (ctx) {
    // 注意传过来的都是字符串
    const { rcid, cid, cuid, isPraised, pid } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    let praiseId, update
    if (isPraised === '0') {
      // 点赞接口
      if (rcid) {
        praiseId = rcid
        update = await ReplyModel.updateOne({ _id: rcid }, { $inc: { hands: 1 } })
      } else if (cid) {
        praiseId = cid
        update = await CommentsModel.updateOne({ _id: cid }, { $inc: { hands: 1 } })
      }
      const data = new CommentsHandsModel({
        pid,
        cid: praiseId,
        uid: obj._id,
        commentAuth: cuid
      })
      const save = await data.save()
      if (save && update.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '点赞成功'
        }
      } else {
        ctx.body = {
          code: 400,
          msg: '系统错误'
        }
      }
    } else if (isPraised === '1') {
      // 取消点赞
      if (rcid) {
        praiseId = rcid
        update = await ReplyModel.updateOne({ _id: rcid }, { $inc: { hands: -1 } })
      } else if (cid) {
        praiseId = cid
        update = await CommentsModel.updateOne({ _id: cid }, { $inc: { hands: -1 } })
      }
      const del = await CommentsHandsModel.deleteOne({ cid: praiseId, uid: obj._id })
      if (del.ok === 1 && update.ok === 1) {
        ctx.body = {
          code: 201,
          msg: '取消点赞成功'
        }
      } else {
        ctx.body = {
          code: 400,
          msg: '系统错误'
        }
      }
    }
  }

  // 获取用户在文章下点赞的评论的列表
  async handsLsPid (ctx) {
    const body = ctx.query
    const pid = body.pid
    const obj = await getPayload(ctx.header.authorization)
    const data = await CommentsHandsModel.find({ uid: obj._id, pid })
    if (data) {
      ctx.body = {
        code: 200,
        msg: '获取文章点赞列表',
        data
      }
    }
  }

  // ------------------------------------ 删除接口
  // 删除评论
  async delComments (ctx) {
    const { pid, cid } = ctx.request.body
    const res = await CommentsModel.delById(cid)
    const del = await ReplyModel.delByCid(cid)
    await CommentsHandsModel.delByCommentId(cid)
    const update = await PostModel.incAnswer(pid, -1 - del.n)
    if (res.n === 1 && res.ok === 1 && update.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除评论成功',
        num: -1 - del.n
      }
    }
  }

  // 删除回复
  async delReply (ctx) {
    const { pid, rid } = ctx.request.body
    const res = await ReplyModel.delById(rid)
    const del = await ReplyModel.delByRid(rid)
    const update = await PostModel.incAnswer(pid, -1 - del.n)
    if (res.n === 1 && res.ok === 1 && update.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除回复成功',
        num: -1 - del.n
      }
    }
  }
}
export default new CommentsController()
