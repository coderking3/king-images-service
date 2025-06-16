import axios from 'axios'
import { post, useResponseError } from '~/utils/request'

// 上传图片
export default eventHandler(async (event) => {
  const csrf = getCertificate(event, 'bili_jct')

  let formData = null
  try {
    formData = await readFormData(event)
  } catch (error) {
    return useResponseError('读取表单数据失败')
  }

  const formParams = new FormData()
  formParams.append('file', formData.get('file'))
  formParams.append('csrf', csrf)
  formParams.append('bucket', 'openplatform')

  const url = 'https://api.bilibili.com/x/upload/web/image'

  const response = await post(url, formParams, {
    withAuth: true,
    event,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response
})
