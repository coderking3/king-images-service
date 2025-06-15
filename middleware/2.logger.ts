export default defineEventHandler(async (event) => {
  const start = Date.now()
  const method = event.method
  const url = event.path || getRequestURL(event).pathname
  const query = getQuery(event)

  console.log(`📝 请求开始: ${method} ${url}`)

  if (Object.keys(query).length > 0) {
    console.log(`📝 查询参数:`, query)
  }

  // 获取请求体（仅对 POST、PUT、PATCH 等请求）
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const body = await readBody(event)
      if (body && Object.keys(body).length > 0) {
        console.log(`📝 请求体:`, body)
      }
    } catch (error) {
      // 读取请求体失败时不进行处理
    }
  }

  // 继续处理请求，并在完成后记录响应时间
  await new Promise((resolve) => {
    const originalEnd = event.node.res.end

    event.node.res.end = function (...args: any[]) {
      const duration = Date.now() - start
      const statusCode = event.node.res.statusCode

      console.log(
        `📝 请求结束: ${method} ${url} - 状态: ${statusCode} - 耗时: ${duration}ms`
      )

      // 调用原始的 end 方法并保持 this 上下文
      return originalEnd.apply(this, args)
    }

    resolve(null)
  })
})
