import { get } from '~/utils/request'

// 生成二维码
export default eventHandler(async (event) => {
  const url =
    'https://passport.bilibili.com/x/passport-login/web/qrcode/generate'

  const response = await get(url)

  return response
})
