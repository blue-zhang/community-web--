import mongoose from '../config/mongoose'
import moment from 'dayjs'

const DraftsSchema = mongoose.Schema({
  uid: {
    type: { String },
    ref: 'users'
  },
  title: { type: { String } },
  content: { type: { String } },
  created: { type: { Date } },
  picUrl: { type: { String } }
})
DraftsSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

const DraftsModel = mongoose.model('drafts', DraftsSchema)
export { DraftsModel }
