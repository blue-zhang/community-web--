import jsonwebtoken from 'jsonwebtoken'
import config from '../config/index'
import { getPayload } from '../common/utils'

const refreshController = {
  // 目前只用返回token
  async refresh (ctx) {
    const obj = await getPayload(ctx.header.authorization)
    // 生成token
    const token = jsonwebtoken.sign({ _id: obj._id }, config.JWT_SECRET, {
      expiresIn: config.tokenExp
    })
    ctx.body = {
      code: 200,
      msg: '获取token成功',
      token
    }
  }
}
export default Object.create(refreshController)
