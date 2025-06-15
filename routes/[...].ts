import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler((event) => {
  // 设置响应头
  event.node.res.setHeader('Content-Type', 'text/html; charset=utf-8')

  try {
    // 获取HTML文件的绝对路径
    const filePath = resolve(process.cwd(), '.output', 'public', 'welcome.html')
    console.log(`🚀 filePath:`, filePath)

    // 读取HTML文件内容
    const htmlContent = readFileSync(filePath, 'utf-8')

    // 设置响应头并返回HTML内容
    return htmlContent
  } catch (error) {
    console.error('读取HTML文件失败:', error)
    return `
      <h1>错误</h1>
      <p>无法加载欢迎页面</p>
    `
  }
})
