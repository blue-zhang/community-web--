import mongoose from '../config/mongoose'
import moment from 'dayjs'

const PostSchema = mongoose.Schema({
  uid: {
    type: { String },
    ref: 'users'
  },
  picUrl: { type: { String } },
  title: { type: { String } },
  content: { type: { String } },
  created: { type: { Date } },
  catalog: { type: { String } },
  fav: { type: { Number } },
  star: { type: { Number } },
  isEnd: { type: { String } },
  reads: { type: { Number } },
  answer: { type: { Number } },
  isReply: { type: { String } },
  isTop: { type: { String } },
  tags: {
    type: { Array },
    default: [
      {
        name: '',
        class: ''
      }
    ]
  }
})

PostSchema.pre('save', function (next) {
  // 利用钩子函数，在保存的时候，把created设置为当前时间
  this.created = moment(moment().format('YYYY-MM-DD HH:mm:ss')).unix() * 1000
  next()
})
PostSchema.statics = {
  /**
   *
   * @param {*} options
   * @param {*} page 属性名表达式，-1是由高到底
   * @param {*} limit
   * @param {*} sort -1是降序排列，最新的时间在前面（由大到小）
   */
  getList: async function (options, page, limit, sort) {
    return await this.find(options)
      .sort({ [sort]: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate({
        path: 'uid',
        select: 'pic fakename isVip'
      })
  },
  getWeekTop: async function () {
    // const date = moment().subtract(7, 'days')
    const res = await this.find({ created: { $gte: moment(moment().subtract(7, 'days')).unix() * 1000 } }, 'reads title')
      .sort('-answer')
      .limit(15)
    return res
  }

}

const PostModel = mongoose.model('posts', PostSchema)
export { PostModel }
