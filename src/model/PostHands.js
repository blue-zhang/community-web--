/*
 * @Author: your name
 * @Date: 2021-03-04 23:14:35
 * @LastEditTime: 2021-03-04 23:28:40
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\PostHands.js
 */
import mongoose from '../config/mongoose'

const Schema = mongoose.Schema
const PostHandsSchema = new Schema({
  pid: { type: String, ref: 'posts' }, // 文章 id
  postAuth: { type: String, ref: 'users' }, // 被点赞用户的id
  uid: { type: String, ref: 'users' }, // 点赞的用户
  isRead: { type: String, default: '0' },
  created: { type: { Date } }
})
PostHandsSchema.pre('save', function (next) {
  this.created = new Date()
  next()
})

PostHandsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

PostHandsSchema.statics = {
  findByCid: function (id) {
    return this.find({ cid: id })
  },
  getHandsByUid: function (id, page, limit) {
    return this.find({ uid: id })
      .populate({
        path: 'uid',
        select: '_id name'
      })
      .populate({
        path: 'cid',
        select: '_id content'
      })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })
  },
  // 查询用户在这篇文章下有没有点赞
  getHandsByUidPid: function ({ uid, pid }) {
    return this.findOne({ uid: uid, pid: pid })
  },
  delByPid: function (pid) {
    return this.deleteMany({ pid })
  },
  getPostHands: async function (uid) {
    const res = await this.find({ postAuth: uid, uid: { $ne: uid } }).populate({
      path: 'uid',
      match: { status: { $ne: '1' } },
      select: 'fakename'
    }).populate({
      path: 'pid',
      match: { status: { $ne: '1' } },
      select: '_id title'
    }).sort({ created: -1 })
    return res
  },

  getUnread: function (uid) {
    return this.find({ postAuth: uid, uid: { $ne: uid }, isRead: '0' }).countDocuments()
  },
  clearUnread: function (uid) {
    return this.updateMany({ postAuth: uid, isRead: '0' }, { isRead: '1' })
  }
}

const PostHandsModel = mongoose.model('post_hands', PostHandsSchema)

export { PostHandsModel }
