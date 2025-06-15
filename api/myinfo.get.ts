import axios from 'axios'

export default eventHandler(async (event) => {
  // 获取凭证
  const SESSDATA = getCookie(event, 'SESSDATA')

  // 获取用户信息
  const url = 'https://api.bilibili.com/x/space/myinfo'
  const response = await axios({
    method: 'GET',
    url: url,
    headers: {
      Cookie: `SESSDATA=${SESSDATA}`,
    },
  })
    .then(function (response) {
      return response.data
    })
    .catch((error) => ({
      code: -1,
      message: error.message,
    }))

  return response
})
