import Router from 'koa-router'
import statisticsController from '@/api/statisticsController'
const router = new Router()
router.prefix('/sttc')
router.get('/achieve', statisticsController.achieve)

export default router
