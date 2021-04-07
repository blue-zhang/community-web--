import { getValue } from '@/config/redisConfig'
import jwt from 'jsonwebtoken'
import config from '../config/index'
import { PostHandsModel } from '@/model/PostHands'
import { Col_infoModel } from '@/model/Col_info'

// token验证，并获取payload
const getPayload = authorization => {
  // Authorization = 'Bearer ' + token, 利用split获取token
  // 获取payload对象,通过result._id获取用户id
  // 如果token过期，verify失败
  const obj = jwt.verify(authorization.split(' ')[1], config.JWT_SECRET)
  return obj
}

// 验证验证码
const checkCode = async (key, value) => {
  const data = await getValue(key)
  if (data != null) {
    if (data.toLowerCase() === value || data === value) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

const praise_hand = async (result, uid) => {
  for (let i = 0; i < result.length; i++) {
    // 判断是否点赞过
    if (!result[i].handed) {
      // 我的动态逻辑，每一篇文章都添加了 handed 属性，不再查询，提高性能
      const praise = await PostHandsModel.findOne({ pid: result[i]._id, uid: uid })
      result[i].handed = '0'
      if (praise) {
        result[i].handed = '1'
      }
    }
    // 判断是否收藏过
    const data = await Col_infoModel.find({ pid: result[i]._id, uid: uid })
    result[i].collected = data.length !== 0 ? '1' : '0'
  }
}

export {
  checkCode,
  getPayload,
  praise_hand
}
