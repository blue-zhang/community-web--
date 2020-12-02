import { PostModel } from '@/model/Post'
import { DraftsModel } from '@/model/Drafts'
import { UserModel } from '@/model/User'
import { getPayload } from '../common/utils'
import moment from 'dayjs'
// import fse from 'fs-extra'
// import uuid from 'uuid'
// import make_dir from 'make-dir'
// import config from '@/config/index'
// import fs from 'fs'

class ContentController {
  async getContent (ctx) {
    // const test = new PostModel({
    //   uid: '5f9925a119368e1b38642ef3',
    //   title: '测试',
    //   content: '',
    //   created: '',
    //   catalog: 'share',
    //   fav: 100,
    //   star: 20,
    //   isEnd: '0',
    //   reads: 10,
    //   answer: 10,
    //   isReply: '0',
    //   isTop: '1',
    //   tags: [
    //     {
    //       name: '精华',
    //       class: 'bg-blue'
    //     }
    //   ]
    // })
    // await test.save()

    // 获取前端传来的数据，并加上初步的判断
    const body = ctx.query
    const sort = body.sort ? body.sort : 'answer'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    const options = {}
    if (typeof body.catalog !== 'undefined' && body.catalog !== '' && body.catalog !== 'index') {
      options.catalog = body.catalog
    }
    if (typeof body.isTop !== 'undefined' && body.isTop !== '') {
      options.isTop = body.isTop
    }
    if (typeof body.isEnd !== 'undefined' && body.isEnd !== '') {
      options.isEnd = body.isEnd
    }
    if (typeof body.tag !== 'undefined' && body.tag !== '') {
      // 此处将options.tags定义为了一种内嵌查询操作符，作为find（）的参数
      options.tags = { $elemMatch: { name: body.tag } }
    }

    const result = await PostModel.getList(options, page, limit, sort)
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
    }
  }

  async getWeekTop (ctx) {
    const result = await PostModel.getWeekTop()
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取本周热议成功'
    }
  }

  // 草稿箱上传内容图片
  // async uploadImg (ctx) {
  //   const obj = await getPayload(ctx.header.authorization)
  //   const file = ctx.request.files.file
  //   const ext = file.name.split('.').pop()
  //   const type = ctx.request.body.type
  //   const created = ctx.request.body.created
  //   const result = await DraftsModel
  //   if (type === 'title') {
  //     const dir = `${config.uploadPath}/${obj._id}/`
  //   }

  //   await make_dir(dir)

  //   // const filePath = `${moment().format('YYYYMMDDHH')}/${picname}.${ext}`
  //   // const destPath = `${dir}/${picname}.${ext}`

  //   const readerStream = fs.createReadStream(file.path)
  //   const writerStream = fs.createWriteStream(destPath)
  //   readerStream.on('data', (chunk) => {
  //     if (writerStream.write(chunk) === false) {
  //       readerStream.pause()
  //     }
  //   })
  //   writerStream.on('drain', () => {
  //     readerStream.resume()
  //   })
  //   readerStream.on('end', () => {
  //     writerStream.end()
  //   })
  //   ctx.body = {
  //     code: 200,
  //     msg: '上传图片成功',
  //     path: filePath
  //   }
  // }

  // 保存草稿箱
  async saveDrafts (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { content, title, picUrl } = ctx.request.body
    const drafts = new DraftsModel({
      uid: obj._id,
      title,
      content,
      picUrl
    })
    const data = await drafts.save()
    if (data) {
      ctx.body = {
        code: 200,
        msg: '草稿保存成功',
        created: data.created
      }
    }
  }

  // 更新草稿内容
  async updateDrafts (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const newCreated = moment().format('YYYY-MM-DD HH:mm:ss')
    const { content, title, picUrl, created } = ctx.request.body
    const lists = await DraftsModel.updateOne({ uid: obj._id, created }, {
      $set: {
        title,
        content,
        picUrl,
        created: newCreated
      }
    })
    if (lists.n === 1 && lists.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '更新草稿成功',
        created: newCreated
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '草稿不存在或已删除'
      }
    }
  }

  // 获取草稿
  async getDrafts (ctx) {
    const type = ctx.query.type
    if (type === '') {
      // 草稿箱获取全部草稿列表
      const obj = await getPayload(ctx.header.authorization)
      const lists = await DraftsModel.find({ uid: obj._id }).sort({ created: -1 })
      if (lists) {
        ctx.body = {
          code: 200,
          msg: '获取草稿成功',
          data: lists
        }
      }
    } else if (type === 'last') {
      // 从草稿箱路由切换到编辑页面时发送的请求
      const obj = await getPayload(ctx.header.authorization)
      const lists = await DraftsModel.findOne({ uid: obj._id }).sort({ created: -1 })
      if (lists) {
        ctx.body = {
          code: 200,
          msg: '获取上次保存草稿成功',
          data: lists
        }
      } else {
        ctx.body = {
          code: 404,
          msg: '您的草稿箱的内容为空'
        }
      }
    } else {
      // 获取指定时间的草稿, type是帖子的时间, 然后更新帖子时间
      const newCreated = moment().format('YYYY-MM-DD HH:mm:ss')
      const obj = await getPayload(ctx.header.authorization)
      await DraftsModel.updateOne({ uid: obj._id, created: type }, { $set: { created: newCreated } })
      const lists = await DraftsModel.findOne({ uid: obj._id, created: newCreated })
      if (lists) {
        ctx.body = {
          code: 200,
          msg: '获取草稿成功',
          data: lists
        }
      }
    }
  }

  // 删除草稿
  async delDrafts (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { created } = ctx.request.body
    const lists = await DraftsModel.deleteOne({ uid: obj._id, created })
    if (lists.n === 1 && lists.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '删除草稿成功'
      }
    }
  }

  // 提交文章
  async submitPost (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    // 除了提问类型文章，fav的值都为0，前端不显示fav=0时的悬赏内容
    const { title, content, picUrl, catalog, fav } = ctx.request.body
    const postData = new PostModel({
      title, content, picUrl, catalog, fav, uid: obj._id
    })
    const userUpdate = await UserModel.updateOne({ _id: obj._id }, { $inc: { favs: -fav } })
    const save = await postData.save()
    if (save.ok === 1 && userUpdate.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '发帖成功'
      }
    }
  }
}

export default new ContentController()
