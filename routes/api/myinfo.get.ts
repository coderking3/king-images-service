import { get } from '~/utils/request'

// 获取用户信息
export default eventHandler(async (event) => {
  const url = 'https://api.bilibili.com/x/space/myinfo'
  const response = await get(url, {
    withAuth: true,
    event,
  })

  return response
})
