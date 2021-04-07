import Router from 'koa-router'
import accountController from '@/api/accountController'
const router = new Router()
router.post('/user/pwdVerify', accountController.pwdVerify)
router.post('/user/changeEmail', accountController.changeEmail)
router.post('/user/updateEmail', accountController.updateEmail)
router.post('/user/changePwd', accountController.changePwd)
router.post('/user/otherVerify', accountController.otherVerify)
router.post('/user/sendEmail', accountController.sendEmail)
router.post('/user/sendMobil', accountController.sendMobil)

export default router
