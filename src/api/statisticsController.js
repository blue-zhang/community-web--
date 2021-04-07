import { PostModel } from '@/model/Post'
import { AttentionModel } from '@/model/Attention'
class StatisticsController {
  async achieve (ctx) {
    let uid = ctx.query.uid
    const type = ctx.query.type
    if (type === 'post') {
      const res = await PostModel.findOne({ _id: uid })
      uid = res.uid
    }
    const post = await PostModel.find({ uid, isPost: true }, { reads: 1, stars: 1, hands: 1 })
    const follower = await AttentionModel.find({ attention: uid }).countDocuments()
    const num = post.length
    let reads = 0
    let hands = 0
    let stars = 0
    for (let i = 0; i < post.length; i++) {
      reads += post[i].reads
      hands += post[i].hands
      stars += post[i].stars
    }
    ctx.body = {
      code: 200,
      data: {
        reads,
        hands,
        stars,
        num,
        follower
      }
    }
  }
}
export default new StatisticsController()
