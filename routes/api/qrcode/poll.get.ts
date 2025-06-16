import { get } from '~/utils/request'

// 轮询二维码状态
export default eventHandler(async (event) => {
  const { qrcode_key = '' } = getQuery(event)

  const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll'
  const response = await get(url, {
    params: { qrcode_key },
  })

  return response
})
