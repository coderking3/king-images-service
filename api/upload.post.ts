import axios from 'axios'
import { useResponseData, useResponseError } from '~/utils/process'
import { getCertificate } from '~/utils/cookie'

export default eventHandler(async (event) => {
  const SESSDATA = getCertificate(event, 'SESSDATA')
  const bili_jct = getCertificate(event, 'bili_jct')

  let formData = null
  try {
    formData = await readFormData(event)
  } catch (error) {
    return {
      code: -1,
      message: '读取表单数据失败',
    }
  }

  const formParams = new FormData()
  formParams.append('file', formData.get('file'))
  formParams.append('csrf', bili_jct)
  formParams.append('bucket', 'openplatform')

  const url = 'https://api.bilibili.com/x/upload/web/image'

  const result = await axios({
    method: 'POST',
    url: url,
    data: formParams,
    headers: {
      'Content-Type': 'multipart/form-data',
      Cookie: `SESSDATA=${SESSDATA}; bili_jct=${bili_jct}`,
    },
  })
    .then(useResponseData)
    .catch(useResponseError)

  return result
})
