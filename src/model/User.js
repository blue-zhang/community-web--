import mongoose from '../config/mongoose'
const defaultUrl =
  process.env.NODE_ENV === 'production'
    ? 'config.baseUrl.pro'
    : 'http://localhost:3000/default'
const UserSchema = mongoose.Schema({
  /**
   * 加入索引去重，重复会报错，然后post钩子会接受到错误，返回错误信息
   */
  fakename: { type: String },
  email: { type: String, index: { unique: true }, sparse: true },
  password: { type: String },
  lastSign: { type: Date },
  favs: { type: Number, default: 100 },
  gender: { type: String, default: '' },
  roles: { type: Array, default: ['user'] },
  pic: { type: String, default: `${defaultUrl}/headPic.png` }, // koa-static处理静态文件
  mobile: { type: String, match: /^1[3-9](\d{9})$/, default: '' },
  status: { type: String, default: '0' },
  regmark: { type: String, default: '' },
  location: { type: String, default: '' },
  birthday: { type: String, default: '' },
  isVip: { type: String, default: '0' },
  lv: { type: String, default: '1' },
  count: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

UserSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Error: Monngoose has a duplicate key.'))
  } else {
    next(error)
  }
})

UserSchema.statics = {
  findByID: function (id) {
    return this.findOne({ _id: id }, {
      // 0代表false，不展示这些数据
      password: 0,
      email: 0,
      mobile: 0
    })
  }
}

const UserModel = mongoose.model('users', UserSchema)
export { UserModel }
