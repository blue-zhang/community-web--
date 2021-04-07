/*
 * @Author: your name
 * @Date: 2020-10-11 14:52:06
 * @LastEditTime: 2021-03-08 10:47:22
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\index.js
 */
import Koa from 'koa'
import cors from '@koa/cors'
import koaBody from 'koa-body'
import json from 'koa-json'
import helmet from 'koa-helmet'
import statics from 'koa-static'
import compose from 'koa-compose'
import compress from 'koa-compress'
import JWT from 'koa-jwt'
// import historyFallback from 'koa2-history-api-fallback'
import errorHandle from './common/errorHandle'
import WsServe from './config/ws'
import config from './config/index'
import path from 'path'
import router from './routes/routes' // 路由集合

const app = new Koa()
const Ws = new WsServe()
Ws.init()

/**
 * 定义公共路径，不需要jwt鉴权
 * secret: config.JWT_SECRET, 与登录接口的一样
 */
const jwt = JWT({ secret: config.JWT_SECRET }).unless({ path: [/^\/public/, /\/login/, /\/user\/sendEmail/, /\/content\/(detail|userPost|userQuestion)/, /\/comments\/(replyLs|lists)/, /\/collect\/(getUserLists_col|getPostLists)/] })
const middleware = compose([
  // historyFallback(),
  koaBody({
    // 配置为可以解析formData
    multipart: true,
    formidable: {
      keepExtensions: true,
      maxFieldsSize: 5 * 1024 * 1024
    },
    onError: err => {
      console.log('koabody TCL: err', err)
    }
  }),
  cors(),
  json({ pretty: false, param: 'pretty' }),
  helmet(),
  statics(path.join(__dirname, '../public')),
  errorHandle,
  jwt
])
if (!config.isDevMode) {
  app.use(compress())
}
app.use(middleware)
app.use(router())
app.listen({
  port: 3000
})
