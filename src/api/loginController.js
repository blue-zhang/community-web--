// import send from '@/config/nodemail'
import moment from 'dayjs'
import jwt from 'jsonwebtoken'
import config from '../config/index'
import { checkCode, getPayload } from '@/common/utils'
import { UserModel } from '@/model/User'
import bcrypt from 'bcrypt'
import { SignModel } from '@/model/Sign'
import { getValue } from '@/config/redisConfig'
import { CollectionModel } from '@/model/Collection'

const loginController = {

  // 忘记密码重置密码
  async reset (ctx) {
    let { password, code, key, email } = ctx.request.body
    password = await bcrypt.hash(password, 5)
    const originCode = await getValue(key)
    if (originCode === code) {
      const update = await UserModel.updateOne({ email: email }, { $set: { password: password } })
      if (update.n === 1 && update.ok === 1) {
        ctx.body = {
          code: 200,
          msg: '您的密码更改成功'
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '您的密码更改失败，请稍后再试，或咨询客服'
        }
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '验证码错误或已过期'
      }
    }
  },

  // 注册接口
  async register (ctx) {
    const { sid, fakename, code, email } = ctx.request.body
    let { password } = ctx.request.body
    // 验证码
    const v_code = await checkCode(sid, code)
    if (v_code) {
      const v_fakename = await UserModel.findOne({ fakename: fakename })
      const v_email = await UserModel.findOne({ email: email })
      if (v_fakename) {
        ctx.body = {
          code: 500,
          msg: '昵称已经存在'
        }
        return
      }
      if (v_email) {
        ctx.body = {
          code: 500,
          msg: '邮箱已经注册'
        }
        return
      }
      // 密码加密后储存在数据库中
      password = await bcrypt.hash(password, 5)
      const user = new UserModel({
        fakename: fakename,
        email: email,
        password: password
      })
      // 数据库存入错误，errorHandle会报错，此处不用判断
      const userSave = await user.save()
      // 创建默认收藏夹
      const collection = new CollectionModel({
        uid: userSave._id
      })
      await collection.save()
      ctx.body = {
        code: 200,
        msg: '注册成功'
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '验证码错误或过期'
      }
    }
  },

  // 登录接口
  async login (ctx) {
    const { sid, username, password, code } = ctx.request.body
    // 验证验证码是否正确
    const v_code = await checkCode(sid, code)
    if (v_code) {
      // 如果没有找到用户，返回 { password: '' }, 避免下面解密时报错
      const userObj = await UserModel.findOne({ email: username }, { password: 1 }) || { password: '' }
      const b_password = await bcrypt.compare(password, userObj.password)
      // bcrypt.compare()返回布尔值
      if (b_password) {
        const userObj = await UserModel.findOne({ email: username }, { email: 0, mobile: 0, password: 0 })
        const token = jwt.sign({ _id: userObj._id }, config.JWT_SECRET, {
          expiresIn: config.tokenExp
        })
        const refreshToken = jwt.sign({ _id: userObj._id }, config.JWT_SECRET, {
          expiresIn: config.refreshExp
        })

        // 查看最新的签到记录
        const sign = await SignModel.findByUid(userObj._id)
        if (sign) {
          if (moment(sign.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
            userObj.isSign = true
          } else {
            userObj.isSign = false
          }
          userObj.lastSign = sign.created
        } else {
          userObj.isSign = false
          userObj.lastSign = moment(0)
        }
        ctx.body = {
          code: 200,
          msg: '登录成功',
          token,
          refreshToken,
          data: userObj
        }
      } else {
        ctx.body = {
          code: 404,
          msg: '用户名或密码错误'
        }
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '验证码错误或过期'
      }
    }
  },

  // refresh接口
  async refresh (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    const token = jwt.sign({ _id: obj._id }, config.JWT_SECRET, {
      expiresIn: config.tokenExp
    })
    ctx.body = {
      code: 200,
      msg: '获取token成功',
      token
    }
  }
}
export default Object.create(loginController)
