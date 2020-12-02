import path from 'path'
const DB_URL = 'mongodb://zb:123456@192.168.248.130:27017/test'
const REDIS = {
  host: '192.168.248.130',
  port: 6379,
  password: 12345678
}
const baseUrl = process.env.NODE_ENV === 'production' ? 'http://www.toimc.com' : 'http://localhost:8080'
const uploadPath = process.env.NODE_ENV === 'production' ? 'app/image' : path.join(path.resolve(__dirname), '../../public')
const JWT_SECRET = 'a&*38QthAKuiRwISGLotgq^3%^$zvA3A6Hfr8MF$jM*HY4*dWcwAW&9NGp7*b53!'
const tokenExp = '5s'
const refreshExp = '60s'
export default {
  baseUrl,
  REDIS,
  JWT_SECRET,
  DB_URL,
  tokenExp,
  refreshExp,
  uploadPath
}
