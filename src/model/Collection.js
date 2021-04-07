/*
 * @Author: your name
 * @Date: 2021-03-05 12:43:03
 * @LastEditTime: 2021-03-06 15:11:13
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\Collection.js
 */
import mongoose from '../config/mongoose'
import { Col_infoModel } from '@/model/Col_info'
const Schema = mongoose.Schema

const CollectionSchema = new Schema({
  name: { type: String, default: '默认收藏夹' },
  uid: { type: String, ref: 'users' }, // 收藏的人
  num: { type: Number, default: 0 } // 减少 postCount 查询的时间，并且减少前端逻辑的复杂性。
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

CollectionSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

CollectionSchema.statics = {
  findOneCol: async function (cid, uid) {
    return await this.findOne({ cid, uid })
  },
  findByUid: async function (uid) {
    // 由晚到早排序，默认收藏夹在最上面
    return await this.find({ uid }).sort({ created: 1 })
  },
  // 删除收藏夹及对应收藏记录
  delById: async function (id) {
    await Col_infoModel.delByCol(id)
    await this.deleteOne({ _id: id })
  }
  // getHandsByUid: function (id, page, limit) {
  //   return this.find({ uid: id })
  //     .populate({
  //       path: 'uid',
  //       select: '_id name'
  //     })
  //     .populate({
  //       path: 'cid',
  //       select: '_id content'
  //     })
  //     .skip(page * limit)
  //     .limit(limit)
  //     .sort({ created: -1 })
  // },
  // delByCommentId: function (cid) {
  //   return this.deleteMany({ cid })
  // },
  // delByPid: function (pid) {
  //   return this.deleteMany({ pid })
  // }
}

const CollectionModel = mongoose.model('collections', CollectionSchema)

export { CollectionModel }
