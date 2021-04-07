import svgCaptcha from 'svg-captcha'
import { setValue } from '@/config/redisConfig'
class PublicController {
  // 登录验证码：发送验证码接口
  // setValue(sid, captcha.text, 10 * 60)
  getCaptcha (ctx) {
    const { sid } = ctx.query
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: 'o0il',
      noise: Math.floor(Math.random() * 5),
      color: true,
      height: 50
    })
    // sid为key，验证码数字为value，保存在redis中
    // 设置图片验证码超时10分钟
    setValue(sid, captcha.text, 10 * 60)
    ctx.body = {
      code: 200,
      data: captcha.data,
      cs_text: captcha.text
    }
  }
}
export default new PublicController()
