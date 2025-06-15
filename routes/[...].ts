export default defineEventHandler((event) => {
  return sendRedirect(event, '/welcome.html')
})
