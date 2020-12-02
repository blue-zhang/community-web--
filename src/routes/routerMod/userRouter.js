import userController from '@/api/userController'
import Router from 'koa-router'

const router = new Router()
router.prefix('/user')

router.get('/fav', userController.getSign)
router.post('/basic', userController.changeBasic)
router.post('/img', userController.uploadImg)
router.post('/pic', userController.changePic)

export default router
