import loginController from '@/api/loginController'
import Router from 'koa-router'
const router = new Router()
router.prefix('/login')

router.post('/login', loginController.login)
router.post('/register', loginController.register)
router.post('/reset', loginController.reset)
router.post('/refresh', loginController.refresh)

export default router
