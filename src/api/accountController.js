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

  // 修改绑定邮箱：发送验证邮件接口
  async changeEmail (ctx) {
    const { newEmail } = ctx.request.body
    const v_email = await UserModel.findOne({ email: newEmail })
    if (!v_email) {
      const obj = await getPayload(ctx.header.authorization)
      const result = await UserModel.findOne({ _id: obj._id })
      const key = uuid()
      // token为value，id为key，存在redis中
      setValue(key, jwt.sign({ _id: obj._id, newEmail: newEmail }, config.JWT_SECRET, { expiresIn: 600 }), 600)
      await send({
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
        msg: '邮件发送成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '该邮箱已经被注册'
      }
    }
  }

  // 修改绑定邮箱：更新邮箱接口
  async updateEmail (ctx) {
    const { key } = ctx.request.body
    // changeEmail 接口将 token 存在 redis 中
    const result = await getValue(key)
    // 解析从 redis 中获取的 token，得到 payload
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

  // 验证 邮箱 和 手机 的验证码
  async otherVerify (ctx) {
    const { key, code } = ctx.request.body
    const originCode = await getValue(key)
    if (originCode === code) {
      ctx.body = {
        code: 200,
        msg: '验证成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '验证码错误或已过期'
      }
    }
  }

  // 发送邮件验证码
  async sendEmail (ctx) {
    const { email } = ctx.request.body
    const captcha = `${Math.floor(Math.random() * 1000000)}`
    const user = await UserModel.findOne({ email: email })
    if (user) {
      // 验证码的 key
      const sid = uuid()
      setValue(sid, captcha, 10 * 60)
      await send({
        code: captcha,
        expire: moment()
          .add(10, 'minutes')
          .format('YYYY-MM-DD HH:mm:ss'),
        email: email,
        user: email
      })
      ctx.body = {
        code: 200,
        msg: '邮件发送成功',
        key: sid
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '该邮箱未注册'
      }
    }
  }

  async sendMobil () {

  }
}
export default new AccountController()
