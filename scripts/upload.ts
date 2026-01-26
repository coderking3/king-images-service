import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import axios from 'axios'
import { UUID } from 'uuidjs'

import 'dotenv/config'
import { API } from '~/constants'
import { imageSize } from 'image-size'

const bili_jct = process.env.BILI_JCT
const SESSDATA = process.env.SESSDATA

const { values } = parseArgs({
  options: {
    file: {
      type: 'string',
      description: 'The file to upload',
      short: 'f',
      required: true,
    },
  },
})

async function upload() {
  if (!bili_jct || !SESSDATA) {
    console.error(
      '缺少 bili_jct 或 SESSDATA 环境变量。请在环境配置（例如 .env）中设置这两个值，然后重试。'
    )
    return
  }

  if (!values.file) {
    console.error(
      '缺少必需的文件参数。请使用 -f <文件路径> 或 --file 指定要上传的文件。'
    )
    return
  }

  const filePath = path.resolve(values.file)

  if (!fs.existsSync(filePath)) {
    console.error(`指定的文件不存在：${filePath}`)
    return
  }

  const stat = fs.statSync(filePath)
  if (!stat.isFile()) {
    console.error(`指定的路径不是文件：${filePath}`)
    return
  }

  const buffer = fs.readFileSync(filePath)
  const { width, height, type } = imageSize(buffer)

  const formParams = new FormData()
  // 使用 Blob 将 Buffer 包装并传入文件名，兼容 Node 的 WHATWG FormData
  formParams.append('file', new Blob([buffer]), path.basename(filePath))
  formParams.append('csrf', bili_jct)
  formParams.append('bucket', 'openplatform')

  try {
    const result = await axios({
      method: 'POST',
      url: API.UPLOAD_IMAGE,
      data: formParams,
      headers: {
        'Content-Type': 'multipart/form-data',
        Cookie: `SESSDATA=${SESSDATA}; bili_jct=${bili_jct}`,
      },
    })

    const resData = result?.data

    // 处理服务端返回的标准结构：{ code, message, data: { location } }
    if (resData && resData.code === 0) {
      const location = resData.data?.location

      console.info('上传成功，返回数据：', {
        id: UUID.generate(),
        name: path.basename(filePath),
        url: location,
        width,
        height,
        type,
        date: Date.now(),
      })
    } else {
      console.error(
        `上传失败：code=${resData?.code ?? 'unknown'} message=${
          resData?.message ?? JSON.stringify(resData)
        }`
      )
    }

    return result
  } catch (err) {
    console.error('上传请求异常：', err)
    return null
  }
}
upload()
