import { SignModel } from '../model/Sign'
import { getPayload } from '../common/utils'
import { UserModel } from '@/model/User'
import moment from 'dayjs'
import config from '@/config/index'
import uuid from 'uuid'
import make_dir from 'make-dir'
import fs from 'fs'

class SignController {
  // 签到接口
  async getSign (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    // 注意这里的user的数据不会因为下面的操作而改变，是初始的
    const user = await UserModel.findByID(obj._id)
    const sign = await SignModel.findByUid(obj._id)
    // 每次签到，创建一个新的签到文档
    let newSign = {}
    // 向前端返回count,favs,fav
    let result = {}
    // 判断该用户是否存在签到记录
    if (sign) {
      // 存在签到记录，判断是否已经签到，前端也要锁死
      if (moment(sign.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        ctx.body = {
          code: 500,
          msg: '今天已经签到了',
          count: user.count,
          favs: user.favs,
          fav: sign.fav
        }
        return
      }
      // 存在签到记录，判断上一次是否签到
      if (moment(sign.created).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
        // 上一次签到，则count+1
        const count = user.count + 1
        let fav = 5
        // 根据count，计算fav，favs累加, 更新user
        if (count <= 15 && count > 5) {
          fav = 10
        } else if (count <= 30 && count > 15) {
          fav = 15
        } else if (count <= 100 && count > 30) {
          fav = 20
        } else if (count <= 200 && count > 100) {
          fav = 30
        } else if (count > 200) {
          fav = 45
        }
        await UserModel.updateOne(
          { _id: obj._id },
          {
            $inc: { favs: fav, count: 1 }
          }
        )
        // 保存一个新的签到文档（时间是利用pre真的保存的
        newSign = new SignModel({
          fav,
          uid: obj._id
        })
        await newSign.save()
        result = {
          favs: user.favs + fav,
          fav,
          count: user.count + 1,
          created: newSign.create
        }
      } else {
        // 上一次没签到，则count=1,fav=5，favs累加, 更新user
        await UserModel.updateOne(
          { _id: obj._id },
          {
            $inc: { favs: 5 },
            $set: { count: 1 }
          }
        )
        newSign = new SignModel({
          fav: 5,
          uid: obj._id
        })
        await newSign.save()
        result = {
          favs: user.favs + 5,
          fav: 5,
          count: 1,
          created: newSign.created
        }
      }
    } else {
      // 没有签到记录，则count=1,fav=5，favs累加, 更新user
      await UserModel.updateOne(
        { _id: obj._id },
        {
          $inc: { favs: 5 },
          $set: { count: 1 }
        }
      )
      // 保存一个新的签到文档
      newSign = new SignModel({
        fav: 5,
        uid: obj._id
      })
      await newSign.save()
      result = {
        favs: user.favs + 5,
        fav: 5,
        count: 1,
        created: newSign.created
      }
    }
    ctx.body = {
      code: 200,
      msg: '签到成功',
      ...result
    }
  }

  // 修改基本信息
  async changeBasic (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const { fakename, birthday, location, gender, regmark } = ctx.request.body
    await UserModel.updateOne({ _id: obj._id }, {
      $set: {
        fakename, birthday, location, gender, regmark
      }
    })
    const userInfo = await UserModel.findOne({ _id: obj._id })
    const result = {
      fakename: userInfo.fakename,
      birthday: userInfo.birthday,
      location: userInfo.location,
      gender: userInfo.gender,
      regmark: userInfo.regmark
    }
    ctx.body = {
      code: 200,
      msg: '用户信息更新成功',
      ...result
    }
  }

  // 更新头像，前端先通过uploadImg上传图片，再更新数据库内对应用户的头像信息
  async changePic (ctx) {
    const { pic } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization)
    const update = await UserModel.updateOne({ _id: obj._id }, { $set: { pic: pic } })
    if (update.n === 1 && update.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '修改头像成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '修改头像失败，请稍后再试'
      }
    }
  }

  // 上传图片
  async uploadImg (ctx) {
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    // const type = ctx.query.type
    // const uid = ctx.query.uid
    // if (type === 'title') {
    //   const dir = `${config.uploadPath}/${uid}/`
    // }
    const picname = uuid()
    // 以日期为依据创建储存图片的文件夹
    const dir = `${config.uploadPath}/${moment().format('YYYYMMDDHH')}`
    // 判断路径是否存在，不存在则创建
    await make_dir(dir)
    // koa-static中设置为了public路径，所以返回给前端的不用包含public路径
    const filePath = `${moment().format('YYYYMMDDHH')}/${picname}.${ext}`
    const destPath = `${dir}/${picname}.${ext}`

    // 同步操作，获取文件大小
    // const stat = fs.statSync(file.path)
    // console.log('uploadImg -> stat', stat.size)
    // highWaterMark默认64kb
    const readerStream = fs.createReadStream(file.path)
    const writerStream = fs.createWriteStream(destPath)
    // 方法1：管道读取操作，简单
    // readerStream.pipe(writerStream)
    // 方法2：适合大文件
    readerStream.on('data', (chunk) => {
      if (writerStream.write(chunk) === false) {
        readerStream.pause()
      }
    })
    writerStream.on('drain', () => {
      readerStream.resume()
    })
    readerStream.on('end', () => {
      writerStream.end()
    })
    ctx.body = {
      code: 200,
      msg: '上传图片成功',
      path: filePath
    }
  }

  // 上穿临时图片（文章头图）
  async uploadTmpImg (ctx) {
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    const picname = uuid()
    // 以日期为依据创建储存图片的文件夹
    const dir = `${config.uploadPath}/${moment().format('YYYYMMDDHH')}`
    // 判断路径是否存在，不存在则创建
    await make_dir(dir)
    // koa-static中设置为了public路径，所以返回给前端的不用包含public路径
    const filePath = `${moment().format('YYYYMMDDHH')}/${picname}.${ext}`
    const destPath = `${dir}/${picname}.${ext}`

    // 同步操作，获取文件大小
    // const stat = fs.statSync(file.path)
    // console.log('uploadImg -> stat', stat.size)
    // highWaterMark默认64kb
    const readerStream = fs.createReadStream(file.path)
    const writerStream = fs.createWriteStream(destPath)
    // 方法1：管道读取操作，简单
    // readerStream.pipe(writerStream)
    // 方法2：适合大文件
    readerStream.on('data', (chunk) => {
      if (writerStream.write(chunk) === false) {
        readerStream.pause()
      }
    })
    writerStream.on('drain', () => {
      readerStream.resume()
    })
    readerStream.on('end', () => {
      writerStream.end()
    })
    ctx.body = {
      code: 200,
      msg: '上传图片成功',
      path: filePath
    }
  }
}

export default new SignController()
