import combineRouters from 'koa-combine-routers'

/**
 * true: 查看子路由
 * './routerMod/': 查询路径
 * /\.js$/: 查询所有.js结尾的文件
 */
const mods = require.context('./routerMod/', true, /\.js$/)

// mods.keys()得到指定目录下的文件名字符串组成的数组
// mods(文件名)是一个对象，default属性为router的默认值
const routeArray = mods.keys().reduce((total, current) => {
  // 将所有的router拼接为一个数组
  total.push(mods(current).default)
  return total
}, [])

// koa-combine-routers接受一个数组，或多个分散的参数
const router = combineRouters(
  routeArray
)

export default router
