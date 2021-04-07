/*
 * @Author: your name
 * @Date: 2021-02-25 15:50:49
 * @LastEditTime: 2021-03-05 13:01:45
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\Comments.js
 */

import mongoose from '../config/mongoose'
const CommentsSchema = mongoose.Schema({
  pid: { type: String, ref: 'posts' }, // 文章ID
  uid: { type: String, ref: 'users' }, // 文章作者ID
  cuid: { type: String, ref: 'users' }, // 评论用户的ID
  content: { type: { String } },
  isBest: { type: String, default: '0' },
  isRead: { type: String, default: '0' },
  status: { type: String, default: '0' }, // 是否可见
  hands: { type: Number, default: 0 }
}, { toJSON: { virtuals: true }, timestamps: { createdAt: 'created', updatedAt: 'updated' } })

CommentsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CommentsSchema.statics = {
  findByPid: function (id) {
    return this.find({ pid: id })
  },
  findByCid: function (id) {
    return this.findOne({ _id: id })
  },
  delById (id) {
    return this.deleteOne({ _id: id })
  },
  delByPid (id) {
    return this.deleteMany({ pid: id })
  },

  // 按文章 pid 查询评论列表
  getCommentsList: function (id, page, limit) {
    return this.find({ pid: id }).populate({
      path: 'cuid',
      select: '_id fakename pic isVip lv regmark',
      match: { status: { $eq: '0' } }
    }).populate({
      path: 'pid',
      select: '_id title status'
    }).skip(page * limit).limit(limit).sort({ hands: -1 }).sort({ created: -1 })
  },
  // 获取用户文章评论信息
  getUserComment: async function (uid, page, limit) {
    const total = await this.find({ uid, cuid: { $ne: uid } }).countDocuments()
    const lists = await this.find({ uid, cuid: { $ne: uid } }).populate({
      path: 'pid',
      match: { status: { $ne: '1' } },
      select: 'title _id'
    }).populate({
      path: 'uid',
      match: { status: { $ne: '1' } },
      select: 'fakename _id'
    }).populate({
      path: 'cuid',
      match: { status: { $ne: '1' } },
      select: 'fakename _id'
    }).skip(page * limit).limit(limit).sort({ created: -1 })
    return {
      total,
      lists
    }
  },
  // 查文章的评论数
  queryCount: function (id) {
    return this.find({ pid: id }).countDocuments()
  },

  getUnread: function (uid) {
    return this.find({ uid, isRead: '0', cuid: { $ne: uid } }).countDocuments()
  },
  clearUnread: function (uid) {
    return this.updateMany({ uid, isRead: '0' }, { isRead: '1' })
  }
}

const CommentsModel = mongoose.model('comments', CommentsSchema)
export { CommentsModel }
