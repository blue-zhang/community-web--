/*
 * @Author: your name
 * @Date: 2021-03-05 16:46:13
 * @LastEditTime: 2021-03-06 11:28:08
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\api\postCollect.js
 */
// import { PostModel, UpdateModel } from '@/model/Post'
import { getPayload } from '../common/utils'
// import { UserModel } from '@/model/User'
import { CollectionModel } from '@/model/Collection'
import { Col_infoModel } from '@/model/Col_info'
import { PostModel } from '@/model/Post'
import { UserModel } from '@/model/User'
class CollectController {
  // 点击收藏弹框时，获取用户对这篇文章的收藏数据
  async getLists_col (ctx) {
    const { pid } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    let lists = await CollectionModel.findByUid(obj._id)

    lists = lists.map((item) => item.toJSON())
    const col_info = await Col_infoModel.getColLs(obj._id, pid)
    if (col_info.length === 0) {
      for (let i = 0; i < lists.length; i++) {
        lists[i].isBlong = '0'
      }
    } else {
      for (let i = 0; i < lists.length; i++) {
        if (col_info.includes(lists[i]._id.toString())) {
          lists[i].isBlong = '1'
        } else {
          lists[i].isBlong = '0'
        }
      }
    }
    ctx.body = {
      code: '200',
      msg: '获取收藏列表成功',
      lists
    }
  }

  // 获取用户所有的收藏夹
  async getUserLists_col (ctx) {
    const { uid } = ctx.query
    const lists = await CollectionModel.findByUid(uid)
    ctx.body = {
      code: '200',
      msg: '获取收藏列表成功',
      lists
    }
  }

  // 创建新的收藏夹
  async createCol (ctx) {
    const { name } = ctx.query
    const obj = await getPayload(ctx.header.authorization)
    const find = await CollectionModel.findOne({ name, uid: obj._id })
    if (find) {
      ctx.body = {
        code: 400,
        msg: '文件夹已存在'
      }
    } else {
      const save = await CollectionModel.create({
        name,
        uid: obj._id
      })
      if (save) {
        ctx.body = {
          code: 200,
          msg: '新建成功',
          data: save
        }
      }
    }
  }

  // 用户收藏文章，可以一次将文章添加到多个收藏夹
  async doCol (ctx) {
    const { pid, source } = ctx.request.body
    // 前端传来的是状态被改变了的收藏夹的列表
    const { colData } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization)

    const bef_data = await Col_infoModel.find({ pid, uid: obj._id })
    let setPost = {}
    // 对改变了的收藏夹执行增加收藏或减少收藏的操作
    for (const v of colData) {
      if (v.isBlong === '1') {
        await Col_infoModel.create({ uid: obj._id, colId: v.colId, pid, source })
        await CollectionModel.updateOne({ _id: v.colId }, { $inc: { num: 1 } })
      } else if (v.isBlong === '0') {
        await Col_infoModel.deleteOne({ pid, colId: v.colId })
        await CollectionModel.updateOne({ _id: v.colId }, { $inc: { num: -1 } })
      }
    }

    // 判断用户是否收藏了文章，并改变文章的收藏总数
    let isBlong
    const aft_data = await Col_infoModel.find({ pid, uid: obj._id })
    if (bef_data.length === 0 && aft_data.length > 0) {
      isBlong = '1'
      setPost = await PostModel.findOneAndUpdate({ _id: pid, isPost: true }, { $inc: { stars: 1 } }, { new: true })
    } else if (bef_data.length > 0 && aft_data.length > 0) {
      isBlong = '1'
      setPost = await PostModel.findOne({ _id: pid, isPost: true })
    } else if (bef_data.length > 0 && aft_data.length === 0) {
      isBlong = '0'
      setPost = await PostModel.findOneAndUpdate({ _id: pid, isPost: true }, { $inc: { stars: -1 } }, { new: true })
    }
    if (setPost) {
      ctx.body = {
        code: 200,
        msg: '设置收藏成功',
        isBlong,
        num: setPost.stars
      }
    }
  }

  async delCol (ctx) {
    const { id } = ctx.query
    await CollectionModel.delById(id)
    ctx.body = {
      code: 200,
      msg: '删除收藏夹成功'
    }
  }

  // 移除收藏夹中的一篇文章
  async cancelCol (ctx) {
    const { colId, pid } = ctx.query
    const del = await Col_infoModel.deleteOne({
      colId, pid
    })
    if (del.ok === 1 && del.n === 1) {
      await CollectionModel.updateOne({ _id: colId }, { $inc: { num: -1 } })
      ctx.body = {
        code: 200,
        msg: '取消收藏成功'
      }
    } else if (del.n === 0) {
      ctx.body = {
        code: 200,
        msg: '您已经取消收藏了这篇文章'
      }
    }
  }

  async rename (ctx) {
    const { newname, id } = ctx.query
    const update = await CollectionModel.updateOne({ _id: id }, { $set: { name: newname } })
    if (update.ok === 1 && update.n === 1) {
      ctx.body = {
        code: 200,
        msg: '重命名成功'
      }
    }
  }

  // 获取收藏夹中的文章列表
  async getPostLists (ctx) {
    const { colId, uid } = ctx.query
    const col = await CollectionModel.findOne({ _id: colId })
    const data = await Col_infoModel.find({ colId, uid }).sort({ created: -1 })
    const user = await UserModel.findOne({ _id: uid }, { fakename: 1 })
    const lists = []
    for (let i = 0; i < data.length; i++) {
      const res = await PostModel.findByPid(data[i].pid)
      lists.push(res)
    }
    ctx.body = {
      code: 200,
      msg: '文章列表返回成功',
      data: lists,
      name: col.name,
      user: user.fakename
    }
  }
}
export default new CollectController()
