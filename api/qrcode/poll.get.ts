import axios from 'axios'
import { useResponseData, useResponseError } from '~/utils/process'

// 轮询二维码状态
export default eventHandler(async (event) => {
  const { qrcode_key = '' } = getQuery(event)

  const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll'
  const response = await axios({
    method: 'GET',
    url: url,
    params: { qrcode_key },
  })
    .then(useResponseData)
    .catch(useResponseError)

  return response
})
