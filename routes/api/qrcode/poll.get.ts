import axios from 'axios'
import { useResponseData, useResponseError } from '~/utils/process'
import { API } from '~/constants'

// 轮询二维码状态
export default eventHandler(async (event) => {
  const { qrcode_key = '' } = getQuery(event)

  const response = await axios({
    method: 'GET',
    url: API.QRCODE_POLL,
    params: { qrcode_key },
  })
    .then(useResponseData)
    .catch(useResponseError)

  return response
})
