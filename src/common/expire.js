/**
 * 此函数有效，但暂时没用处
 */

const moment = require('dayjs')

// 让token每durtion个小时的整点失效
function expire (now, durtion) {
  const nowHour = Math.floor(moment(now).hour() / durtion)
  const endTime = moment(moment(moment().hour((nowHour + 1) * durtion).format('YYYY-MM-DD HH')).format('YYYY-MM-DD HH:mm:ss')).unix()
  const expireIn = endTime - moment().unix()
  return expireIn
}

export default expire
