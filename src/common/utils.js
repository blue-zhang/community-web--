import { getValue } from '@/config/redisConfig'
import jwt from 'jsonwebtoken'
import config from '../config/index'

const getPayload = authorization => {
  // Authorization = 'Bearer ' + token, 利用split获取token
  // 获取payload对象,通过result._id获取用户id
  return jwt.verify(authorization.split(' ')[1], config.JWT_SECRET)
}
const checkCode = async (key, value) => {
  console.log('key', key)

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

export {
  checkCode,
  getPayload
}
