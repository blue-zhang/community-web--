import combineRouters from 'koa-combine-routers'

/**
 * true: 查看子路由
 * './routerMod/': 查询路径
 * /\.js$/: 查询所有.js结尾的文件
 */
const mods = require.context('./routerMod/', true, /\.js$/)
// console.log('mods', mods('./loginRouter.js').default)

// keys()得到文件名组成的数组
// mods(文件名)是一个对象，default属性为router的默认值
// 将所有的router拼接为一个数组
const routeArray = mods.keys().reduce((total, current) => {
  total.push(mods(current).default)
  return total
}, [])
// console.log('routeCompose', routeArray)

// koa-combine-routers接受一个router数组，或多个router参数
const router = combineRouters(
  routeArray
)

export default router
