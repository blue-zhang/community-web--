import redis from 'redis'
import { promisifyAll } from 'bluebird'
import config from './index'

const options = {
  host: config.REDIS.host,
  port: config.REDIS.port,
  password: config.REDIS.password,
  // 传递buffers类型的值时，不会转换成string
  detect_buffers: true,
  retry_strategy: function (options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error('The server refused the connection')
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error('Retry time exhausted')
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000)
  }
}
const client = promisifyAll(redis.createClient(options))
client.on('error', (err) => {
  console.log('Redis Client Error:' + err)
})

const setValue = (key, value, time) => {
  if (typeof value === 'undefined' || value == null || value === '') {
    return
  }
  if (typeof value === 'string') {
    if (typeof time !== 'undefined') {
      // 默认单位为s
      client.set(key, value, 'EX', time)
    } else {
      client.set(key, value)
    }
  } else if (typeof value === 'object') {
    // redis.print 回调函数，打印日志
    Object.keys(value).forEach((item) => {
      client.hset(key, item, value[item], redis.print)
    })
  }
}

const getValue = async (key) => {
  return await client.getAsync(key)
}

const getHValue = async (key) => {
  return await client.hgetallAsync(key)
}

const delValue = async (key) => {
  const result = await client.delAsync(key)
  return result
}

const exists = async (key) => {
  const result = await client.existsAsync(key)
  return result
}

export { client, setValue, getValue, getHValue, delValue, exists }
