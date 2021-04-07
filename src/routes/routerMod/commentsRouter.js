/*
 * @Author: your name
 * @Date: 2021-02-25 21:47:44
 * @LastEditTime: 2021-03-04 15:00:59
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \api\src\routes\routerMod\commentsRouter.js
 */

import Router from 'koa-router'
import commentsController from '@/api/commentsController'

const router = new Router()

router.prefix('/comments')

// 添加评论
router.post('/submit', commentsController.addComment)
router.get('/lists', commentsController.getCommentsLs)
router.post('/submitReply', commentsController.submitReply)
router.get('/replyLs', commentsController.getReplyLs)
router.post('/del', commentsController.delComments)
router.post('/delReply', commentsController.delReply)
router.get('/hand', commentsController.handComments)
router.get('/handPL', commentsController.handsLsPid)

export default router
