/*
 * @Author: your name
 * @Date: 2021-02-26 15:56:17
 * @LastEditTime: 2021-03-06 20:31:19
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\Reply.js
 */
import mongoose from '../config/mongoose'
const ReplySchema = mongoose.Schema({
  pid: { type: String, ref: 'posts' }, // 文章的ID
  cid: { type: String, ref: 'comments' }, // 回复所在的文章评论的ID

  // cid 和 rid可能是同一个
  // 被回复的评论/回复，可能属于文章评论或回复两个集合
  // 查询不到，就使用 cid 数据
  rid: { type: String, ref: 'replys' },
  ruid: { type: String, ref: 'users' }, // 被回复的评论/回复的用户ID

  rcuid: { type: String, ref: 'users' }, // 回复的用户ID
  content: { type: { String } },
  status: { type: String, default: '0' }, // 是否可见
  isRead: { type: String, default: '0' },
  hands: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

ReplySchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

ReplySchema.statics = {
  findByRcid: function (id) {
    return this.findOne({ rcid: id })
  },
  findByPid: function (id) {
    return this.find({ pid: id })
  },
  findByCid: function (id) {
    return this.find({ cid: id })
  },
  delById (id) {
    return this.deleteOne({ _id: id })
  },
  delByPid (id) {
    return this.deleteMany({ pid: id })
  },
  delByCid (id) {
    return this.deleteMany({ cid: id })
  },
  delByRid (id) {
    return this.deleteMany({ rid: id })
  },
  getReplyList: function (id, page, limit) {
    return this.find({ cid: id }).populate({
      path: 'rcuid',
      select: '_id fakename pic isVip lv regmark',
      match: { status: { $eq: '0' } }
    })
      .populate({
        path: 'ruid',
        select: '_id fakename pic isVip  lv regmark',
        match: { status: { $eq: '0' } }
      })
      .skip(page * limit).limit(limit).sort({ hands: -1 }).sort({ created: 1 })
  },
  getReplyData: function (id) {
    return this.findOne({ _id: id }).populate({
      path: 'rcuid',
      select: '_id fakename pic isVip lv regmark',
      match: { status: { $eq: '0' } }
    })
      .populate({
        path: 'ruid',
        select: '_id fakename pic isVip lv regmark',
        match: { status: { $eq: '0' } }
      })
  },
  getUserReply: async function (id, page, limit) {
    const total = await this.find({ ruid: id, rcuid: { $ne: id } }).countDocuments()
    const lists = await this.find({ ruid: id, rcuid: { $ne: id } }).populate({
      path: 'rcuid',
      select: '_id fakename pic isVip lv regmark',
      match: { status: { $eq: '0' } }
    }).populate({
      path: 'pid',
      match: { status: { $eq: '0' } }
    }).populate({
      path: 'cid',
      match: { status: { $eq: '0' } }
    }).populate({
      path: 'rid',
      match: { status: { $eq: '0' } }
    }).skip(page * limit).limit(limit).sort({ created: -1 })
    return { total, lists }
  },
  findCid: async function (id) {
    const reply = await this.findOne({ _id: id })
    return reply.cid
  },
  countDoc: async function (id) {
    return this.find({ cid: id }).countDocuments()
  },

  getUnread: function (uid) {
    return this.find({ ruid: uid, isRead: '0', rcuid: { $ne: uid } }).countDocuments()
  },
  clearUnread: async function (uid) {
    const res = await this.updateMany({ ruid: uid, isRead: '0' }, { isRead: '1' })
    return res
  }
}

const ReplyModel = mongoose.model('replys', ReplySchema)
export { ReplyModel }
