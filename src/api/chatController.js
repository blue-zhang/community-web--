import { Chat_infoModel } from '@/model/Chat-Info'
import { getPayload } from '../common/utils'

class ChatController {
  // 同一个私信，要存到两个数据库中，注意 sender，receiver 之间的转换
  async addChatMes (ctx) {
    const { receiver, mes } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    // 发送这条消息的人的数据库
    const senderDB = await Chat_infoModel.findOne({ receiver, sender: obj._id })
    // 接收这条消息的人的数据库
    const receiverDB = await Chat_infoModel.findOne({ sender: receiver, receiver: obj._id })
    if (senderDB && receiverDB) {
      senderDB.mes.push({
        sender: mes
      })
      receiverDB.mes.push({
        receiver: mes
      })
      await senderDB.save()
      await receiverDB.save()
      ctx.body = {
        code: 200
      }
    } else {
      // 创建数据库
      const senderDB = await await Chat_infoModel.create({
        sender: obj._id,
        receiver,
        mes: [{
          sender: mes
        }]
      })
      const receiverDB = await Chat_infoModel.create({
        sender: receiver,
        receiver: obj._id,
        mes: [{
          receiver: mes
        }]
      })
      if (senderDB && receiverDB) {
        ctx.body = {
          code: 200
        }
      }
    }
  }

  // 获取私信用户列表
  async getReceive (ctx) {
    const { receiver } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const is = await Chat_infoModel.findOne({ sender: obj._id, receiver })
    if (!is) {
      const res = await Chat_infoModel.create({
        sender: obj._id,
        receiver
      })
      console.log(res)
    }
    const lists = await Chat_infoModel.aggregate([
      { $match: { sender: obj._id } },
      {
        $project: {
          lastMes: {
            $slice: ['$mes', -1, 1]
          },
          receiver: 1,
          unread: 1,
          updated: 1,
          sender: 1
        }
      },
      { $unwind: '$lastMes' },
      {
        $lookup: {
          from: 'users',
          let: { ouid: { $toObjectId: '$receiver' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$ouid'] } } },
            { $project: { _id: 1, fakename: 1, isVip: 1, pic: 1 } }
          ],
          as: 'receiver'
        }
      },
      { $unwind: '$receiver' },
      { $sort: { updated: -1 } }
    ])
    console.log(lists.length)
    if (lists) {
      ctx.body = {
        code: 200,
        data: lists
      }
    }
  }

  // 获取和一个用户的所有私信
  async getMes (ctx) {
    const { receiver } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const arr = await Chat_infoModel.findOne({ receiver, sender: obj._id })
    if (arr) {
      ctx.body = {
        code: 200,
        data: arr.mes
      }
    } else {
      ctx.body = {
        code: 200,
        data: []
      }
    }
  }

  async clearUnread (ctx) {
    const { receiver } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const lists = await Chat_infoModel.findOneAndUpdate({ receiver, sender: obj._id }, { $set: { unread: 0 } }, { new: false })
    if (lists) {
      ctx.body = {
        code: 200,
        reduce: lists.unread
      }
    }
  }

  async addTime (ctx) {
    const { receiver, time } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const arr = await Chat_infoModel.findOne({ receiver, sender: obj._id })
    if (arr) {
      arr.mes.push({
        time
      })
    }
    ctx.body = {
      code: 200
    }
  }

  async delChat (ctx) {
    const { receiver } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const del = await Chat_infoModel.deleteOne({ receiver, sender: obj._id })
    if (del.ok === 1) {
      ctx.body = {
        code: 200,
        mes: '删除成功'
      }
    }
  }

  // 增加一个未读数
  async incUnread (ctx) {
    const { receiver, sender } = ctx.query
    const update = await Chat_infoModel.updateOne({ sender: receiver, receiver: sender }, { $inc: { unread: 1 } })
    if (update.ok === 1 && update.n === 1) {
      ctx.body = {
        code: 200
      }
    }
  }
}

export default new ChatController()
