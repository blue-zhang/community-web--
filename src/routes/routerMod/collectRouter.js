/*
 * @Author: your name
 * @Date: 2021-03-05 16:52:09
 * @LastEditTime: 2021-03-05 23:19:32
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\routes\routerMod\collectRouter.js
 */
import Router from 'koa-router'
import CollectController from '@/api/collectController'

const router = new Router()

router.prefix('/collect')

// 添加/取消收藏时，获取用户收藏列表，包含文章是否收藏的状态
router.get('/getLists_col', CollectController.getLists_col)
// 用户收藏列表
router.get('/getUserLists_col', CollectController.getUserLists_col)
// 收藏夹的文章列表
router.get('/getPostLists', CollectController.getPostLists)
// 新建收藏
router.get('/createCol', CollectController.createCol)
// 删除收藏夹
router.get('/delCol', CollectController.delCol)
// 收藏文章
router.post('/doCol', CollectController.doCol)
// 取消收藏文章
router.get('/cancelPost', CollectController.cancelCol)
// 收藏夹重命名
router.get('/rename', CollectController.rename)

export default router
