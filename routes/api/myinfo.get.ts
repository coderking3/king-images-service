import axios from 'axios'
import { useResponseData, useResponseError } from '~/utils/process'
import { getCertificate } from '~/utils/cookie'
import { API } from '~/constants'

export default eventHandler(async (event) => {
  // 获取凭证
  const SESSDATA = getCertificate(event, 'SESSDATA')

  // 获取用户信息
  const response = await axios({
    method: 'GET',
    url: API.USER_INFO,
    headers: {
      Cookie: `SESSDATA=${SESSDATA}`,
    },
  })
    .then(useResponseData)
    .catch(useResponseError)

  return response
})
