import WebSocket from 'ws'
import { getPayload } from '@/common/utils'
import { ReplyModel } from '@/model/Reply'
import { CommentsModel } from '@/model/Comments'
import { CommentsHandsModel } from '@/model/CommentsHands'
import { PostHandsModel } from '@/model/PostHands'
import { Chat_infoModel } from '@/model/Chat-Info'
import config from './index'
// import { setValue, getValue, exists } from '@/config/redisConfig'
class WsServe {
  constructor (fig = {}) {
    const defaultConfig = {
      port: config.wsPort,
      timeInteral: 30 * 1000,
      isAuth: true // 是否开启鉴权
    }
    const finalConfig = { ...defaultConfig, ...fig }
    this.timeInteral = finalConfig.timeInteral
    this.isAuth = finalConfig.isAuth
    this.port = finalConfig.port
    this.wss = {}
    this.clientsOn = new Map()
    this.options = fig.options || {}
  }

  init () {
    this.wss = new WebSocket.Server({
      port: this.port, ...this.options
    })
    this.wss.on('connection', (ws) => {
      this.onconnection(ws)
    })
  }

  onconnection (ws) {
    // 心跳检测
    ws.isAlive = true
    // 用户刚打开连接的时候，默认没有进入聊天房
    ws.onChat = false
    ws.on('message', (mes) => {
      this.onmessage(ws, mes)
    })
    ws.on('close', () => {
      this.onclose(ws)
    })
    // this.interval = this.heartInterval()
  }

  async onmessage (ws, mes) {
    const data = JSON.parse(mes)
    // 用户进入房间的鉴权
    const events = {
      auth: async () => {
        this.auth(data, ws)
      },
      heartbeat: async () => {
        // 客户端端发送 pong 信息后将 isAlive = true
        if (data.mes === 'pong') {
          ws.isAlive = true
        }
      },
      mes: async () => {
        // 鉴权拦截
        if (ws.isAuth && this.isAuth) {
          // this.sendToOne(data)
        }
      },
      chat: async () => {
        if (ws.isAuth && this.isAuth) {
          this.sendToOne(data)
        }
      }
    }
    events[data.event]()
  }

  async onclose () {

  }

  // 点对点的消息发送, 对方不在线，历史消息。。。。。。
  // data 是 sender 发送过来的数据对象
  async sendToOne (data) {
    // 把消息转发给连接到连接到 ws 的客户，由客户端判断该数据是否已读
    let receiverClient = {}
    for (const item of this.wss.clients.values()) {
      if (item.sender === data.receiver) {
        receiverClient = item
        return
      }
    }
    if (receiverClient.sender) {
      receiverClient.send(JSON.stringify(data))
    } else {
      await Chat_infoModel.updateOne({ sender: data.receiver, receiver: data.sender }, { $inc: { unread: 1 } })
    }
  }

  // 广播消息 -> 推送系统消息
  broadcast (msg) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  }

  // 鉴权
  // 给 ws 加上 sender 标识
  // 并发送用户有多少条未读消息
  async auth (data, ws) {
    try {
      const obj = await getPayload(data.mes)
      if (obj) {
        ws.isAuth = true
        ws.sender = obj._id
        const postHand = await PostHandsModel.getUnread(obj._id)
        const comHand = await CommentsHandsModel.getUnread(obj._id)
        const postCom = await CommentsModel.getUnread(obj._id)
        const comReply = await ReplyModel.getUnread(obj._id)
        const chatNum = await Chat_infoModel.getUnread(obj._id)
        ws.send(JSON.stringify({
          event: 'info',
          postHand,
          comHand,
          postCom,
          comReply,
          chatNum
        }))
      }
    } catch (error) {
      ws.isAuth = false
      ws.send(JSON.stringify({
        event: 'noauth',
        mes: 'auth is not ok'
      }))
    }
  }

  // 心疼检测，用户进入房间后心跳检测
  // 发送 ping 后将 isAlive 设为 false
  // 客户端端发送 pong 信息后将 isAlive = true
  // 如果客户端没有发送 pong，就会 client.terminate()
  // 客户端设置两次 ping 直接的时间差大于 timeInteral + 1000 则客户端重启链接
  // heartInterval () {
  //   clearInterval(this.interval)
  //   this.interval = setInterval(() => {
  //   // this.wss.clients 是所有在线用户的set数据
  //     this.wss.clients.forEach((client) => {
  //       // 如果客户端没有发送 pong，就会 client.terminate()
  //       if (!client.isAlive) {
  //         return client.terminate()
  //       }
  //       // 发送 ping 后将 isAlive 设为 false
  //       client.isAlive = false
  //       client.send(JSON.stringify({
  //         event: 'heartbeat',
  //         mes: 'ping'
  //       }))
  //     })
  //   }, this.timeInteral)
  // }
}
export default WsServe
