/*
 * @Author: your name
 * @Date: 2020-10-11 14:52:06
 * @LastEditTime: 2021-03-07 13:05:28
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \api\src\routes\routerMod\publicRouter.js
 */
import Router from 'koa-router'
import publicController from '@/api/publicController'
import ContentController from '@/api/contentController'

const router = new Router()
router.prefix('/public')

router.get('/captcha', publicController.getCaptcha) // 自动将ctx参数传递, 不用加（）
router.get('/list', ContentController.getList)
router.get('/topWeek', ContentController.getWeekTop)

export default router
