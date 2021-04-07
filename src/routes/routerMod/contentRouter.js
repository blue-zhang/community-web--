/*
 * @Author: your name
 * @Date: 2020-11-22 22:07:51
 * @LastEditTime: 2021-03-07 13:20:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\routes\routerMod\contentRouter.js
 */
import Router from 'koa-router'
import contentController from '@/api/contentController'
const router = new Router()
router.prefix('/content')
// public 也有这个接口，登录后使用这个接口，用来判断用户有没有点赞和收藏
router.get('/list', contentController.getListLogin)
router.post('/drafts', contentController.saveDrafts)
router.post('/updateDrafts', contentController.updateDrafts)
router.get('/getDrafts', contentController.getDrafts)
router.post('/delDrafts', contentController.delDrafts)
router.post('/submit', contentController.submitPost)
router.get('/detail', contentController.getDetail)
router.post('/delPost', contentController.delPost)
router.post('/updatePost', contentController.updatePost)
router.post('/submitUpdate', contentController.submitUpdate)
router.get('/loadUpdate', contentController.loadUpdate)
router.get('/handPost', contentController.handPost)
router.get('/incReads', contentController.incReads)
router.get('/userPost', contentController.userPost)
router.get('/userQuestion', contentController.userQuestion)

export default router
