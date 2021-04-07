
const DB_URL = 'mongodb://zb:123456@192.168.248.130:27017/test'
const isDevMode = process.env.NODE_ENV !== 'production'

const REDIS = {
  host: '192.168.248.130',
  port: 6379,
  password: 12345678
}
const baseUrl = process.env.NODE_ENV === 'production' ? 'http://www.toimc.com' : 'http://localhost:8080'
const uploadPath = process.env.NODE_ENV === 'production' ? 'app/image' : 'public'
const JWT_SECRET = 'a&*38QthAKuiRwISGLotgq^3%^$zvA3A6Hfr8MF$jM*HY4*dWcwAW&9NGp7*b53!'
const tokenExp = '2h'
const refreshExp = '30d'
const wsPort = 3001
export default {
  baseUrl,
  isDevMode,
  REDIS,
  JWT_SECRET,
  DB_URL,
  tokenExp,
  refreshExp,
  uploadPath,
  wsPort
}
