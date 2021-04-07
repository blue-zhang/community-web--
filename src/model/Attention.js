import mongoose from '../config/mongoose'
const Schema = mongoose.Schema

const AttentionSchema = new Schema({
  uid: { type: String, ref: 'users' }, // 关注者
  attention: { type: String, ref: 'users' }, // 被关注的人
  created: { type: { Date } }
})
AttentionSchema.pre('save', function (next) {
  this.created = new Date()
  next()
})
AttentionSchema.statics = {
  getAttention: function (uid, page, limit) {
    return this.find({ uid })
      .populate({ path: 'uid', select: '_id fakename pic isVip lv regmark' })
      .populate({ path: 'attention', select: '_id fakename pic isVip lv regmark' })
      .skip(page * limit)
      .limit(limit)
  },
  getAttentionMe: async function (uid, page, limit) {
    // const res = await this.aggregate([
    //   {
    //     $match: { attention: uid }
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       let: { ouid: { $toObjectId: '$uid' } },
    //       pipeline: [
    //         { $match: { $expr: { $eq: ['$_id', '$$ouid'] } } },
    //         { $project: { _id: 1, fakename: 1, pic: 1, isVip: 1, lv: 1, regmark: 1 } }
    //       ],
    //       as: 'uid'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       let: { oattention: { $toObjectId: '$attention' } },
    //       pipeline: [
    //         { $match: { $expr: { $eq: ['$_id', '$$oattention'] } } },
    //         { $project: { _id: 1, fakename: 1, pic: 1, isVip: 1, lv: 1, regmark: 1 } }
    //       ],
    //       as: 'attention'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'attentions',
    //       let: { ouid: { $toObjectId: '$uid' }, oattention: { $toObjectId: '$attention' } },
    //       pipeline: [
    //         { $match: { $expr: { $eq: ['$uid', '$$oattention'] } } },
    //         { $match: { $expr: { $eq: ['$attention', '$$ouid'] } } },
    //         { $project: { _id: 1 } }
    //       ],
    //       as: 'isFollowed'
    //     }
    //   },
    //   { $sort: { created: -1 } },
    //   { $skip: page * limit },
    //   { $limit: limit }
    // ])
    return this.find({ attention: uid })
      .sort({ created: -1 })
      .populate({ path: 'uid', select: '_id fakename pic isVip lv regmark' })
      .populate({ path: 'attention', select: '_id fakename pic isVip lv regmark' })
      .skip(page * limit)
      .limit(limit)
  },
  delAttention: function (uid, attention) {
    return this.deleteOne({ uid, attention })
  }
}
const AttentionModel = mongoose.model('attentions', AttentionSchema)
export { AttentionModel }
