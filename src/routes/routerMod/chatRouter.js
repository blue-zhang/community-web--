import Router from 'koa-router'
import chatController from '@/api/chatController'
const router = new Router()
router.get('/chat/addChatMes', chatController.addChatMes)
router.get('/chat/getReceive', chatController.getReceive)
router.get('/chat/clearUnread', chatController.clearUnread)
router.get('/chat/addTime', chatController.addTime)
router.get('/chat/getMes', chatController.getMes)
router.get('/chat/del', chatController.delChat)
router.get('/chat/incUnread', chatController.incUnread)
export default router
