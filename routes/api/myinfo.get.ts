import axios from 'axios'
import { useResponseData, useResponseError } from '~/utils/process'
import { getCertificate } from '~/utils/cookie'

export default eventHandler(async (event) => {
  // 获取凭证
  const SESSDATA = getCertificate(event, 'SESSDATA')

  // 获取用户信息
  const url = 'https://api.bilibili.com/x/space/myinfo'
  const response = await axios({
    method: 'GET',
    url: url,
    headers: {
      Cookie: `SESSDATA=${SESSDATA}`,
    },
  })
    .then(useResponseData)
    .catch(useResponseError)

  return response
})
