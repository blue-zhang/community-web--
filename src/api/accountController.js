import { getPayload } from '../common/utils'
import { UserModel } from '@/model/User'
import { checkCode } from '@/common/utils'
import bcrypt from 'bcrypt'
import moment from 'dayjs'
import uuid from 'uuid/v4'
import send from '@/config/nodemail'
import { setValue, getValue } from '@/config/redisConfig'
import jwt from 'jsonwebtoken'
import config from '../config/index'

class AccountController {
  // 密码验证接口
  async pwdVerify (ctx) {
    const { password, code, sid } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization)
    const v_code = await checkCode(sid, code)
    if (v_code) {
      const result = await UserModel.findOne({ _id: obj._id })
      const b_password = await bcrypt.compare(password, result.password)
      if (b_password) {
        ctx.body = {
          code: 200,
          msg: '身份验证成功'
        }
      } else {
        ctx.body = {
          code: 501,
          msg: '密码错误'
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '验证码错误或已过期'
      }
    }
  }

  // 修改绑定邮箱，发送邮件接口
  async changeEmail (ctx) {
    const { newEmail } = ctx.request.body
    const v_email = await UserModel.findOne({ email: newEmail })
    if (!v_email) {
      const obj = await getPayload(ctx.header.authorization)
      const result = await UserModel.findOne({ _id: obj._id })
      const key = uuid()
      // 邮件发送时为这次发送创建一个新的token，把新邮箱放进payload
      // token为value，uuid为key，存在redis中
      setValue(key, jwt.sign({ _id: obj._id, newEmail: newEmail }, config.JWT_SECRET, { expiresIn: 600 }), 600)
      const mail = await send({
        data: {
          // nodemail通过key取得用户token,发送到前端修改成功页面，前端解析token,发送更新邮箱的请求
          key: key
        },
        expire: moment().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        email: newEmail,
        user: result.fakename
      }, 'changeEmail')
      ctx.body = {
        code: 200,
        data: mail,
        msg: '邮件发送成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '该邮箱已经注册'
      }
    }
  }

  // 修改绑定邮箱，更新邮箱接口
  async updateEmail (ctx) {
    const { key } = ctx.request.body
    const result = await getValue(key)
    // Bearer前缀是axios请求拦截器中在headers中config.headers.Authorization中设置的
    const obj = await getPayload('Bearer ' + result)
    const update = await UserModel.updateOne({ _id: obj._id }, { $set: { email: obj.newEmail } })
    if (update.n === 1 && update.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '您的绑定邮箱更新成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '您的绑定邮箱更新失败，请稍后再试，或咨询客服'
      }
    }
  }

  // 修改密码
  async changePwd (ctx) {
    let { password } = ctx.request.body
    const obj = await getPayload(ctx.header.authorization)
    password = await bcrypt.hash(password, 5)
    const update = await UserModel.updateOne({ _id: obj._id }, { $set: { password: password } })
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
  }
}
export default new AccountController()
