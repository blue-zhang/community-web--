import config from '@/config/index'
const nodemailer = require('nodemailer')
async function send (sendInfo, type = 'forgetPwd') {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: {
      user: '3031196013@qq.com',
      pass: 'vzqatzwtleatdfig'
    }
  })
  // 修改绑定邮箱
  let html = ''
  if (type === 'forgetPwd') {
    html = `
          <div style="border: 1px solid #dcdcdc;color: #676767;width: 600px; margin: 0 auto; padding-bottom: 50px;position: relative;">
          <div style="height: 60px; background: #393d49; line-height: 60px; color: #58a36f; font-size: 18px;padding-left: 10px;">感谢使用z网</div>
          <div style="padding: 25px">
            <div>您好，${sendInfo.user}，请在${sendInfo.expire
      }之前重置您的密码：</div>
            <p>验证码为：${sendInfo.code}</p>
            <div style="padding: 5px; background: #f2f2f2;">如果该邮件不是由你本人操作，请勿进行激活！否则你的邮箱将会被他人绑定。</div>
          </div>
          <div style="background: #fafafa; color: #b4b4b4;text-align: center; line-height: 45px; height: 45px; position: absolute; left: 0; bottom: 0;width: 100%;">系统邮件，请勿直接回复</div>
      </div>
    `
  } else if (type === 'changeEmail') {
    const sucUrl = config.baseUrl + '/#/user/accountBar/changeSucc' + '?' + `key=${sendInfo.data.key}&type='UpdateEmail'`
    html = `
          <div style="border: 1px solid #dcdcdc;color: #676767;width: 600px; margin: 0 auto; padding-bottom: 50px;position: relative;">
          <div style="height: 60px; background: #393d49; line-height: 60px; color: #58a36f; font-size: 18px;padding-left: 10px;">感谢使用z网</div>
          <div style="padding: 25px">
            <div>您好，${sendInfo.user}，链接有效时间10分钟，请在${sendInfo.expire
      }之前重置您的邮箱：</div>
            <a href=${sucUrl} style="padding: 10px 20px; color: #fff; background: #009e94; display: inline-block;margin: 15px 0;">点击此链接</a>便可重置您的邮箱
            <div style="padding: 5px; background: #f2f2f2;">如果该邮件不是由你本人操作，请勿进行激活！否则你的邮箱将会被他人绑定。</div>
          </div>
          <div style="background: #fafafa; color: #b4b4b4;text-align: center; line-height: 45px; height: 45px; position: absolute; left: 0; bottom: 0;width: 100%;">系统邮件，请勿直接回复</div>
      </div>
    `
  }

  const info = await transporter.sendMail({
    from: '"认证邮件" <3031196013@qq.com>',
    to: sendInfo.email,
    subject: sendInfo.user !== '' ? `你好，${sendInfo.user}！社区服务网站验证邮件` : '社区服务网站验证邮件',
    text: `您在《慕课网前端全栈实践》课程中注册，您的邀请码是${sendInfo.code},邀请码的过期时间: ${sendInfo.expire}`,
    html: html
  })
  return `Message sent: %s, ${info.messageId}`
}
export default send
