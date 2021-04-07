import mongoose from '../config/mongoose'

const SignSchema = mongoose.Schema({
  uid: { type: String, ref: 'users' },
  favs: { type: Number, default: 5 }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

SignSchema.statics = {
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
