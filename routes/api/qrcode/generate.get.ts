import axios from 'axios'
import { API } from '~/constants'
import { useResponseData, useResponseError } from '~/utils/process'

// 生成二维码
export default eventHandler(async () => {
  const response = await axios({
    method: 'GET',
    url: API.QRCODE_GENERATE,
  })
    .then(useResponseData)
    .catch(useResponseError)

  return response
})
