// import send from '@/config/nodemail'
import moment from 'dayjs'
import jsonwebtoken from 'jsonwebtoken'
import config from '../config/index'
import { checkCode, getPayload } from '@/common/utils'
import { UserModel } from '@/model/User'
import bcrypt from 'bcrypt'
import { SignModel } from '@/model/Sign'
import { getValue } from '@/config/redisConfig'

const loginController = {
  // 登录时忘记密码的重置密码接口
  async reset (ctx) {
    let { password, userkey } = ctx.request.body
    password = await bcrypt.hash(password, 5)
    const token = await getValue(userkey)
    const obj = getPayload('Bearer ' + token)
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
  },
  // 注册接口
  async register (ctx) {
    const { sid, fakename, code, email } = ctx.request.body
    let { password } = ctx.request.body
    // 验证码
    const v_code = await checkCode(sid, code)
    if (v_code) {
      const password1 = await UserModel.findOne({ fakename: fakename })
      const password2 = await UserModel.findOne({ email: email })
      if (password1) {
        ctx.body = {
          code: 403,
          msg: '昵称已经存在'
        }
        return
      }
      if (password2) {
        ctx.body = {
          code: 405,
          msg: '邮箱已经注册'
        }
        return
      }
      // 存储数据
      password = await bcrypt.hash(password, 5)
      const user = new UserModel({
        fakename: fakename,
        email: email,
        password: password,
        created: moment().format('YYYY-MM-DD HH:mm:ss')
      })
      // 数据库存入错误，errorHandle会报错，此处不用判断s
      const result = await user.save()
      ctx.body = {
        code: 200,
        data: result,
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
      // let v_username = await UserModel.findOne({ $or: [{ fakename: username }, { email: username }] })
      let v_username = await UserModel.findOne({ fakename: username })
      // null.password会报错，要给一个默认值
      if (!v_username) {
        v_username = {
          password: ''
        }
      }
      if (v_username.password) {
        /**
         * 验证密码是否正确
         * bcrypt.compare()密码解密，返回布尔值
         */
        const b_password = await bcrypt.compare(password, v_username.password)
        if (b_password) {
          // 使用toJSON（），让对象中只保存数据值，没有别的乱七八糟
          const userObj = v_username.toJSON()
          // 生成token
          const token = jsonwebtoken.sign({ _id: userObj._id }, config.JWT_SECRET, {
            expiresIn: config.tokenExp
          })
          const refreshToken = jsonwebtoken.sign({ _id: userObj._id }, config.JWT_SECRET, {
            expiresIn: config.refreshExp
          })

          // 删除敏感数据
          // 用户id从token中获取
          const listsDel = ['password', 'mobile', 'roles', 'email']
          listsDel.map(item => {
            delete userObj[item]
          })
          // 登录之后，查看上一次签到记录/本次签到记录
          // -1由大到小，最新的在最前面
          // userObj._id是objectId类型，存在sign中uid的类型是string，但是也能查到。。。
          const sign = await SignModel.findByUid(userObj._id)
          if (sign) {
            if (moment(sign.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
              userObj.isSign = true
            } else {
              userObj.isSign = false
            }
            userObj.lastSign = sign.created
            userObj.fav = sign.fav
          } else {
            userObj.isSign = false
            userObj.lastSign = moment(0)
            userObj.fav = 5
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
          code: 402,
          msg: '用户名不存在'
        }
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '验证码错误或过期'
      }
    }
  }
}
export default Object.create(loginController)
