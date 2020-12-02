import Koa from 'koa'
import cors from '@koa/cors'
import koaBody from 'koa-body'
import json from 'koa-json'
import router from './routes/routes' // 路由集合
import helmet from 'koa-helmet'
import statics from 'koa-static'
import compose from 'koa-compose'
import compress from 'koa-compress'
import JWT from 'koa-jwt'
import errorHandle from './common/errorHandle'
import config from './config/index'
import path from 'path'

const app = new Koa()

const isDevMode = process.env.NODE_ENV !== 'production'

/**
 * 定义公共路径，不需要jwt鉴权
 * secret: config.JWT_SECRET, 与登录接口的一样
 */
const jwt = JWT({ secret: config.JWT_SECRET }).unless({ path: [/^\/public/, /\/login/] })
const middleware = compose([
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
if (!isDevMode) {
  app.use(compress())
}
app.use(middleware)
app.use(router())
app.listen({
  port: 3000
})
