import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(() => {
  try {
    // 获取HTML文件的绝对路径
    const filePath = resolve(process.cwd(), 'pages', 'welcome.html')

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
