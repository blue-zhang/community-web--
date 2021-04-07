/*
 * @Author: your name
 * @Date: 2021-03-02 22:04:38
 * @LastEditTime: 2021-03-06 10:17:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\CommentsHands.js
 */
import mongoose from '../config/mongoose'

const Schema = mongoose.Schema
// 不存 pid，使用 aggregate
const CommentsSchema = new Schema({
  pid: { type: String, ref: 'posts' },
  cid: { type: String }, // 回复 或 评论的 _id
  commentAuth: { type: String, ref: 'users' }, // 被点赞用户的id
  created: { type: { Date } },
  isRead: { type: String, default: '0' },
  uid: { type: String, ref: 'users' } // 点赞的用户
})

CommentsSchema.pre('save', function (next) {
  this.created = new Date()
  next()
})

CommentsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CommentsSchema.statics = {
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
  getHandsByUidPid: function (uid, pid) {
    return this.find({ uid: uid, pid: pid })
  },
  // 获取用户评论点赞 信息
  // status.....
  getCommentsHands: async function (uid) {
    const res = await this.aggregate([
      { $match: { $expr: { $ne: ['$uid', uid] }, commentAuth: uid } },
      {
        $lookup: {
          from: 'users',
          let: { ouid: { $toObjectId: '$uid' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$ouid'] } } },
            { $project: { _id: 1, fakename: 1 } }
          ],
          as: 'users'
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$users', 0] }, '$$ROOT']
          }
        }
      },
      {
        $lookup: {
          from: 'comments',
          let: { ocid: { $toObjectId: '$cid' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$ocid'] } } },
            { $project: { _id: 1, pid: 1, content: 1 } }
          ],
          as: 'comments'
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$comments', 0] }, '$$ROOT']
          }
        }
      },
      // { $unwind: '$comments' }
      {
        $lookup: {
          from: 'replys',
          let: { orid: { $toObjectId: '$cid' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$orid'] } } },
            { $project: { _id: 1, pid: 1, content: 1 } }
          ],
          as: 'replys'
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$replys', 0] }, '$$ROOT']
          }
        }
      },
      // 利用上面聚合查询得到的 pid
      {
        $lookup: {
          from: 'posts',
          let: { opid: { $toObjectId: '$pid' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$opid'] } } },
            { $project: { _id: 1, title: 1 } }
          ],
          as: 'posts'
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$posts', 0] }, '$$ROOT']
          }
        }
      },
      { $sort: { created: -1 } }
    ])
    return res
  },
  delByCommentId: function (cid) {
    return this.deleteMany({ cid })
  },
  delByPid: function (pid) {
    return this.deleteMany({ pid })
  },

  getUnread: function (uid) {
    return this.find({ commentAuth: uid, uid: { $ne: uid }, isRead: '0' }).countDocuments()
  },
  clearUnread: function (uid) {
    return this.updateMany({ commentAuth: uid, isRead: '0' }, { isRead: '1' })
  }
}

const CommentsHandsModel = mongoose.model('comments_hands', CommentsSchema)

export { CommentsHandsModel }
