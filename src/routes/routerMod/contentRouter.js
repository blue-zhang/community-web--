import Router from 'koa-router'
import contentController from '@/api/contentController'
const router = new Router()
router.prefix('/content')
router.post('/drafts', contentController.saveDrafts)
router.post('/updateDrafts', contentController.updateDrafts)
router.get('/getDrafts', contentController.getDrafts)
router.post('/delDrafts', contentController.delDrafts)

export default router
