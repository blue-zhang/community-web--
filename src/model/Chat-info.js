import mongoose from '../config/mongoose'
const Schema = mongoose.Schema

const Chat_infoSchema = new Schema({
  sender: { type: String, ref: 'users' },
  receiver: { type: String, ref: 'users' },
  // [{receiver: mes}, {sender: mes}]
  mes: { type: Array, default: [] },
  unread: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })
// isRead === '1' 代表已读

Chat_infoSchema.statics = {
  getUnread: async function (uid) {
    const res = await this.find({ sender: uid })
    let total = 0
    res.forEach(element => {
      total += element.unread
    })
    return total
  }
}

const Chat_infoModel = mongoose.model('chat_infos', Chat_infoSchema)

export { Chat_infoModel }
