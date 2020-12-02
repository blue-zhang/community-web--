import mongoose from '../config/mongoose'
import moment from 'dayjs'

const SignSchema = mongoose.Schema({
  uid: { type: String, ref: 'users' },
  fav: { type: Number, default: 5 },
  created: { type: Date, default: '2000-10-21T08:35:35.200+0000' }
})

SignSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

SignSchema.statics = {
  // 按时间排序非常重要
  // -1是降序排列，最新的时间在前面（由大到小）
  findByUid: async function (uid) {
    // 使用find查询
    // const result = await this.find({ uid: uid }).sort({ created: -1 })
    // return result[0]
    return this.findOne({ uid: uid }).sort({ created: -1 })
  }
}

const SignModel = mongoose.model('signs', SignSchema)
export { SignModel }
