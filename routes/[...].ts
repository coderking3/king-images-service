export default defineEventHandler((event) => {
  // console.log(`🚀 event:`, event)
  // 获取当前请求路径
  const path = event.path || getRequestURL(event).pathname
  // 如果当前路径不是 /welcome.html 和 /favicon.ico ，才进行重定向
  if (path !== '/welcome.html' && path !== '/favicon.ico') {
    return sendRedirect(event, '/welcome.html')
  }
})
