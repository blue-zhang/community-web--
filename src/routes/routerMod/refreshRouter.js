import refreshController from '@/api/refreshController'
import Router from 'koa-router'
const router = new Router()

router.get('/refresh', refreshController.refresh)

export default router
