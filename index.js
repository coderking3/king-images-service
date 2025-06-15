#!/usr/bin/env node

// 导入文件系统模块
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

// 构建后的服务器文件路径
const serverPath = path.join(__dirname, '.output/server/index.mjs')

// 检查构建后的服务器文件是否存在
if (!fs.existsSync(serverPath)) {
  console.error('错误: 找不到构建文件，请先运行 npm run build')
  process.exit(1)
}

console.log('正在启动 Nitro 服务...')

// 使用子进程运行 .mjs 文件
const child = spawn('node', ['--experimental-modules', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // 可以在这里设置额外的环境变量
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
})

// 处理子进程事件
child.on('close', (code) => {
  if (code !== 0) {
    console.error(`服务进程退出，退出码: ${code}`)
  }
})

// 处理进程信号，确保正确关闭子进程
process.on('SIGINT', () => {
  console.log('接收到中断信号，正在关闭服务...')
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('接收到终止信号，正在关闭服务...')
  child.kill('SIGTERM')
})
