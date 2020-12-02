import svgCaptcha from 'svg-captcha'
import { setValue, getValue } from '@/config/redisConfig'
import { UserModel } from '@/model/User'
import uuid from 'uuid/v4'
import send from '@/config/nodemail'
import moment from 'dayjs'
import jwt from 'jsonwebtoken'
import config from '../config/index'

const publicController = {
  getCaptcha (ctx) {
    const { sid } = ctx.query
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: 'o0il',
      noise: Math.floor(Math.random() * 5),
      color: true,
      height: 50
    })
    // sid为key，验证码数字为value，保存在redis中
    // 设置图片验证码超时10分钟
    setValue(sid, captcha.text, 10 * 60)
    ctx.body = {
      code: 200,
      data: captcha.data,
      cs_text: captcha.text
    }
  },

  // 发送短信和邮箱验证码
  // 在用户登录之前和之后都会用到这个接口
  // 为了在没有token的时候也能定位用户是谁
  // 可以把带有用户ID的token作为值，sid+'user'为key，储存在redis中，在登录忘记密码的修改密码页面使用
  // 过期时间和验证码过期时间相同，需要在前端提示用户验证时间已过期，请重新发送验证码
  async sendCode (ctx) {
    const { verify } = ctx.request.body
    let email, mobile
    const email_reg = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/
    const mobile_reg = /^1[3-9](\d{9})$/
    const captcha = `${Math.floor(Math.random() * 1000000)}`
    if (email_reg.test(verify)) {
      email = verify
      const user = await UserModel.findOne({ email: email })
      if (user) {
        const sid = uuid()
        const userSid = sid + 'user'
        const _id = user._id
        setValue(sid, captcha, 10 * 60)
        setValue(userSid, jwt.sign({ _id: _id }, config.JWT_SECRET, { expiresIn: 600 }), 600)
        const result = await send({
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
          data: result,
          key: sid,
          userkey: userSid

        }
      } else {
        ctx.body = {
          code: 500,
          msg: '找不到用户'
        }
      }
    } else if (mobile_reg.test(verify)) {
      mobile = verify
      console.log('otherVerify -> mobile', mobile)
    } else {
      ctx.body = {
        code: 500,
        msg: '找不到用户'
      }
    }
  },
  // 验证验证码
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
}
export default Object.create(publicController)
