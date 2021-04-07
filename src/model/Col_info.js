/*
 * @Author: your name
 * @Date: 2021-03-05 12:43:11
 * @LastEditTime: 2021-03-06 15:10:59
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\model\Col_info.js
 */
import mongoose from '../config/mongoose'
// import { CollectionModel } from '@/model/Collection'
const Schema = mongoose.Schema

const Col_infoSchema = new Schema({
  pid: { type: String, ref: 'posts' },
  colId: { type: String, ref: 'collections' }, // 收藏夹
  source: { type: String, ref: 'users' }, // 文章作者
  created: { type: { Date } },
  uid: { type: String, ref: 'users' } // 收藏的人
})

Col_infoSchema.pre('save', function (next) {
  this.created = new Date()
  next()
})

Col_infoSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

Col_infoSchema.statics = {
  getColLs: async function (uid, pid) {
    const data = await this.find({ uid, pid })
    if (data.length === 0) {
      return []
    }
    const res = []
    data.forEach((item) => {
      res.push(item.colId)
    })
    return res
  },
  delByPUid: async function (pid, uid) {
    return await this.deleteMany({ pid, uid })
  },
  delByPid: async function (pid) {
    return await this.deleteMany({ pid })
  },
  delByCol: async function (id) {
    return await this.deleteMany({ colId: id })
  }
}

const Col_infoModel = mongoose.model('col_infos', Col_infoSchema)

export { Col_infoModel }
