// jwt鉴权的错误处理，jwt-koa官方给出的方法，通过app.use（）使用
export default async function (ctx, next) {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401
      ctx.body = {
        code: 401,
        msg: 'Protected resource, use Authorization header to get access\n'
      }
    } else {
      // throw err
      // debugger
      ctx.status = err.status || 500
      // console.log(err.stack)
      ctx.body = Object.assign({
        code: 500,
        msg: err.message
      }, process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  })
}
