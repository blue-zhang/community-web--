/*
 * @Author: your name
 * @Date: 2020-10-13 21:40:15
 * @LastEditTime: 2021-03-07 11:26:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\Post.js
 */
import mongoose from '../config/mongoose'
import moment from 'dayjs'

const PostSchema = mongoose.Schema({
  uid: {
    type: { String },
    ref: 'users'
  },
  // 是否被发表
  isPost: { type: { Boolean }, default: false },
  picUrl: { type: { String } },
  title: { type: { String } },
  content: { type: { String } },
  // 发表后，更新为发表时间
  catalog: { type: { String }, default: '' },
  // 悬赏的积分
  favs: { type: { Number }, default: 0 },
  isEnd: { type: { String }, default: '0' },
  status: { type: { String }, default: '0' }, // 是否可以回复
  isTop: { type: { String }, default: '0' },
  answer: { type: { Number }, default: 0 },
  reads: { type: { Number }, default: 0 },
  stars: { type: Number, default: 0 },
  hands: { type: Number, default: 0 },
  tags: {
    type: { Array },
    default: [
      {
        name: '',
        class: ''
      }
    ]
  }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

const UpdateSchema = mongoose.Schema({
  pid: {
    type: { String },
    ref: 'posts'
  },
  picUrl: { type: { String } },
  title: { type: { String } },
  content: { type: { String } }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

// 视图查询？？？
// PostSchema.virtual('user', {
//   ref: 'users',
//   localField: 'uid',
//   foreignField: '_id'
// })

PostSchema.statics = {
  getList: async function (options, page, limit, sort) {
    try {
      return await this.find(options, { content: 0 })
        .sort({ [sort]: -1 })
        .skip(page * limit)
        .limit(limit)
        .populate({
          path: 'uid',
          select: 'pic fakename isVip lv regmark'
        })
    } catch (error) {
      console.log(error)
    }
  },
  getPost: async function (uid, limit, page, sort = 'created') {
    return await this.find({ uid, isPost: true, catalog: { $ne: 'ask' } }, { content: 0 }).populate({
      path: 'uid',
      select: 'fakename pic isVip lv _id regmark catalog'
    }).sort({ [sort]: -1 }).skip(page * limit)
      .limit(limit)
  },
  getQuestion: async function (uid, limit, page, sort = 'created') {
    return await this.find({ uid, catalog: 'ask', isPost: true }, { content: 0 }).populate({
      path: 'uid',
      select: 'fakename pic isVip lv _id regmark catalog'
    }).sort({ [sort]: -1 }).skip(page * limit)
      .limit(limit)
  },
  // 文章详情，返回内容
  findByPid: function (id) {
    return this.findOne({ _id: id, isPost: true }).populate({
      path: 'uid',
      select: 'fakename pic isVip lv _id regmark'
    })
  },
  findUid: function (pid) {
    const data = this.findOne({ _id: pid, isPost: true }, { content: 0 })
    return data.uid
  },
  getWeekTop: async function () {
    const res = await this.find({ created: { $gte: moment(moment().subtract(7, 'days')).unix() * 1000 }, isPost: true }, 'reads title')
      .sort('-answer')
      .limit(10)
    return res
  },
  delById: async function (id) {
    return this.deleteOne({ _id: id, isPost: true })
  },
  incAnswer: function (pid, val) {
    return this.updateOne({ _id: pid, isPost: true }, { $inc: { answer: val } })
  },
  countByUid: function (id) {
    return this.find({ uid: id, isPost: true }).countDocuments()
  },
  countPost: function (id) {
    return this.find({ uid: id, isPost: true, catalog: { $ne: 'ask' } }).countDocuments()
  },
  countAsk: function (id) {
    return this.find({ uid: id, isPost: true, catalog: 'ask' }).countDocuments()
  }
}

const PostModel = mongoose.model('posts', PostSchema)
const UpdateModel = mongoose.model('posts_update', UpdateSchema)
export { PostModel, UpdateModel }
