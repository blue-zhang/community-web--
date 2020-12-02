import Router from 'koa-router'
import publicController from '@/api/publicController'
import contentController from '@/api/contentController'

const router = new Router()
router.prefix('/public')

router.get('/captcha', publicController.getCaptcha) // 自动将ctx参数传递, 不用加（）
router.get('/list', contentController.getContent)
router.get('/topWeek', contentController.getWeekTop)
router.post('/code', publicController.sendCode)
router.post('/verify', publicController.otherVerify)

export default router
