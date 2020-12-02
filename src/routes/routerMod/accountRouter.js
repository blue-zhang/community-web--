import Router from 'koa-router'
import accountController from '@/api/accountController'
const router = new Router()
router.post('/user/pwdVerify', accountController.pwdVerify)
router.post('/user/changeEmail', accountController.changeEmail)
router.post('/user/updateEmail', accountController.updateEmail)
router.post('/user/changePwd', accountController.changePwd)

export default router
