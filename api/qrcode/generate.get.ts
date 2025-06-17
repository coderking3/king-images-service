import axios from 'axios'
import { useResponseData, useResponseError } from '~/utils/process'

// 生成二维码
export default eventHandler(async () => {
  const url =
    'https://passport.bilibili.com/x/passport-login/web/qrcode/generate'

  const response = await axios({
    method: 'GET',
    url: url,
  })
    .then(useResponseData)
    .catch(useResponseError)

  return response
})
