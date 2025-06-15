import axios from 'axios'

export default eventHandler(async (event) => {
  const SESSDATA = getCookie(event, 'SESSDATA')
  const bili_jct = getCookie(event, 'bili_jct')

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
      Cookie: `bili_jct=${bili_jct}; SESSDATA=${SESSDATA};`,
    },
  })
    .then(function (response) {
      return response.data
    })
    .catch((error) => ({
      code: -1,
      message: error.message,
    }))

  return result
})
