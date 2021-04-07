import userController from '@/api/userController'
import Router from 'koa-router'

const router = new Router()
router.prefix('/user')

router.post('/basic', userController.changeBasic)
router.post('/img', userController.uploadImg)
router.post('/pic', userController.changePic)
router.get('/sign', userController.getSign)
router.get('/getUserInfo', userController.getUserInfo)
router.get('/getUserReply', userController.getUserReply)
router.get('/getPostComment', userController.getPostComment)
router.get('/getCommentHands', userController.getCommentHands)
router.get('/getPostHands', userController.getPostHands)
router.get('/clearInfo', userController.clearInfo)
router.get('/activites', userController.activites)
router.get('/attentions', userController.attentions)
router.get('/attentionsMe', userController.attentionsMe)
router.get('/addAttention', userController.addAttention)
router.get('/delAttention', userController.delAttention)
router.get('/isAttention', userController.isAttention)

export default router
