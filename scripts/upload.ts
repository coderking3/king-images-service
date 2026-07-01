import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import axios from 'axios'
import { checkbox, confirm } from '@inquirer/prompts'
import { imageSize } from 'image-size'
import { UUID } from 'uuidjs'

import 'dotenv/config'
import { API } from '~/constants'

type SupportedImageType = 'jpg' | 'png' | 'webp' | 'gif'

interface ImageFile {
  path: string
  name: string
  size: number
  width: number
  height: number
  type: SupportedImageType
}

interface UploadRecord {
  id: string
  name: string
  url: string
  width: number
  height: number
  type: SupportedImageType
  date: number
}

interface UploadSuccess {
  file: ImageFile
  record: UploadRecord
}

interface UploadFailure {
  file: ImageFile
  reason: string
}

const bili_jct = process.env.BILI_JCT
const SESSDATA = process.env.SESSDATA
const DEFAULT_OUTPUT_PATH = '.output/upload-images.json'
const DEFAULT_CONCURRENCY = 3
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const SUPPORTED_TYPES = new Set(['jpg', 'png', 'webp', 'gif'])

const { values } = parseArgs({
  options: {
    file: {
      type: 'string',
      description: 'The file to upload',
      short: 'f',
    },
    dir: {
      type: 'string',
      description: 'The directory to scan images from',
      short: 'd',
    },
    output: {
      type: 'string',
      description: 'The JSON file to save upload records',
      short: 'o',
      default: DEFAULT_OUTPUT_PATH,
    },
    concurrency: {
      type: 'string',
      description: 'Max concurrent uploads',
      short: 'c',
      default: String(DEFAULT_CONCURRENCY),
    },
    recursive: {
      type: 'boolean',
      description: 'Scan directory recursively',
      default: false,
    },
  },
})

function printUsage() {
  console.info(`
用法：
  pnpm upload -- -f <file>
  pnpm upload -- -d <dir> [--recursive]

参数：
  -f, --file <file>          上传单个图片
  -d, --dir <dir>            扫描目录并选择图片上传
  -o, --output <file>        保存 JSON 路径，默认 ${DEFAULT_OUTPUT_PATH}
  -c, --concurrency <num>    批量上传并发数，默认 ${DEFAULT_CONCURRENCY}
      --recursive            目录模式递归扫描子目录
`)
}

function ensureEnv() {
  if (bili_jct && SESSDATA) {
    return true
  }

  console.error(
    '缺少 bili_jct 或 SESSDATA 环境变量。请在环境配置（例如 .env）中设置这两个值，然后重试。'
  )
  return false
}

function assertInputMode() {
  if (values.file && values.dir) {
    throw new Error('参数冲突：-f/--file 与 -d/--dir 只能选择一个。')
  }

  if (!values.file && !values.dir) {
    throw new Error('缺少上传目标：请传入 -f <文件路径> 或 -d <目录路径>。')
  }
}

function parseConcurrency() {
  const concurrency = Number(values.concurrency)

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`无效的并发数：${values.concurrency}。请传入大于 0 的整数。`)
  }

  return concurrency
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function normalizeImageType(type?: string): SupportedImageType | null {
  if (!type) {
    return null
  }

  const normalizedType = type === 'jpeg' ? 'jpg' : type
  return SUPPORTED_TYPES.has(normalizedType)
    ? (normalizedType as SupportedImageType)
    : null
}

function readImageFile(filePath: string): ImageFile | null {
  const ext = path.extname(filePath).toLowerCase()

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return null
  }

  const stat = fs.statSync(filePath)

  if (!stat.isFile()) {
    return null
  }

  try {
    const buffer = fs.readFileSync(filePath)
    const sizeInfo = imageSize(buffer)
    const type = normalizeImageType(sizeInfo.type)

    if (!type || !sizeInfo.width || !sizeInfo.height) {
      return null
    }

    return {
      path: filePath,
      name: path.basename(filePath),
      size: stat.size,
      width: sizeInfo.width,
      height: sizeInfo.height,
      type,
    }
  } catch {
    return null
  }
}

function collectImagesFromDirectory(dirPath: string, recursive: boolean) {
  const images: ImageFile[] = []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (recursive) {
        images.push(...collectImagesFromDirectory(entryPath, recursive))
      }
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const image = readImageFile(entryPath)

    if (image) {
      images.push(image)
    }
  }

  return images
}

function getSingleImage(fileValue: string) {
  const filePath = path.resolve(fileValue)

  if (!fs.existsSync(filePath)) {
    throw new Error(`指定的文件不存在：${filePath}`)
  }

  const image = readImageFile(filePath)

  if (!image) {
    throw new Error(
      `指定的文件不是受支持的图片：${filePath}。支持 jpg/jpeg/png/webp/gif。`
    )
  }

  return image
}

function getDirectoryImages(dirValue: string, recursive: boolean) {
  const dirPath = path.resolve(dirValue)

  if (!fs.existsSync(dirPath)) {
    throw new Error(`指定的目录不存在：${dirPath}`)
  }

  const stat = fs.statSync(dirPath)

  if (!stat.isDirectory()) {
    throw new Error(`指定的路径不是目录：${dirPath}`)
  }

  return collectImagesFromDirectory(dirPath, recursive)
}

async function selectImages(images: ImageFile[]) {
  if (values.file) {
    return images
  }

  console.info(`找到 ${images.length} 个可上传图片：`)

  return checkbox<ImageFile>({
    message: '请选择要上传的图片（空格选择，a 全选，回车确认）',
    choices: images.map((image) => ({
      name: `${image.name} (${image.width}×${image.height}, ${formatBytes(
        image.size
      )}, ${image.type})`,
      value: image,
      checked: true,
    })),
    required: true,
    pageSize: 12,
  })
}

async function uploadImage(file: ImageFile): Promise<UploadRecord> {
  const buffer = fs.readFileSync(file.path)
  const formParams = new FormData()

  formParams.append('file', new Blob([buffer]), file.name)
  formParams.append('csrf', bili_jct ?? '')
  formParams.append('bucket', 'openplatform')

  const result = await axios({
    method: 'POST',
    url: API.UPLOAD_IMAGE,
    data: formParams,
    headers: {
      Cookie: `SESSDATA=${SESSDATA}; bili_jct=${bili_jct}`,
    },
  })

  const resData = result?.data

  if (resData?.code !== 0) {
    throw new Error(
      `code=${resData?.code ?? 'unknown'} message=${
        resData?.message ?? JSON.stringify(resData)
      }`
    )
  }

  const location = resData.data?.location

  if (!location) {
    throw new Error(`接口未返回图片地址：${JSON.stringify(resData)}`)
  }

  return {
    id: UUID.generate(),
    name: file.name,
    url: location,
    width: file.width,
    height: file.height,
    type: file.type,
    date: Date.now(),
  }
}

async function uploadWithPool(files: ImageFile[], concurrency: number) {
  const successes: UploadSuccess[] = []
  const failures: UploadFailure[] = []
  let cursor = 0

  async function worker() {
    while (cursor < files.length) {
      const file = files[cursor]
      cursor += 1

      try {
        console.info(`开始上传：${file.name}`)
        const record = await uploadImage(file)
        successes.push({ file, record })
        console.info(`上传成功：${file.name}`)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        failures.push({ file, reason })
        console.error(`上传失败：${file.name}，${reason}`)
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, () => worker())
  )

  return { successes, failures }
}

function printSummary(successes: UploadSuccess[], failures: UploadFailure[]) {
  console.info('\n上传完成：')
  console.info(`  成功：${successes.length}`)
  console.info(`  失败：${failures.length}`)

  if (successes.length > 0) {
    console.info('\n成功文件：')
    for (const success of successes) {
      console.info(`  - ${success.file.name}: ${success.record.url}`)
    }
  }

  if (failures.length > 0) {
    console.info('\n失败文件：')
    for (const failure of failures) {
      console.info(`  - ${failure.file.name}: ${failure.reason}`)
    }
  }
}

function readExistingRecords(outputPath: string): UploadRecord[] {
  if (!fs.existsSync(outputPath)) {
    return []
  }

  const raw = fs.readFileSync(outputPath, 'utf8').trim()

  if (!raw) {
    return []
  }

  const data = JSON.parse(raw)

  if (!Array.isArray(data)) {
    throw new Error(`输出文件不是 JSON 数组：${outputPath}`)
  }

  return data
}

function saveRecords(outputValue: string, records: UploadRecord[]) {
  const outputPath = path.resolve(outputValue)
  const outputDir = path.dirname(outputPath)

  fs.mkdirSync(outputDir, { recursive: true })

  const existingRecords = readExistingRecords(outputPath)
  const nextRecords = [...existingRecords, ...records]

  fs.writeFileSync(outputPath, `${JSON.stringify(nextRecords, null, 2)}\n`)
  console.info(`已保存 ${records.length} 条记录到：${outputPath}`)
}

async function main() {
  try {
    if (!ensureEnv()) {
      process.exitCode = 1
      return
    }

    assertInputMode()

    const concurrency = parseConcurrency()
    const images = values.file
      ? [getSingleImage(values.file)]
      : getDirectoryImages(values.dir ?? '', Boolean(values.recursive))

    if (images.length === 0) {
      console.info('没有找到可上传图片。支持 jpg/jpeg/png/webp/gif。')
      return
    }

    const selectedImages = await selectImages(images)

    if (selectedImages.length === 0) {
      console.info('没有选择任何图片，已取消上传。')
      return
    }

    console.info(
      `准备上传 ${selectedImages.length} 个图片，并发数：${Math.min(
        concurrency,
        selectedImages.length
      )}`
    )

    const { successes, failures } = await uploadWithPool(
      selectedImages,
      concurrency
    )

    printSummary(successes, failures)

    if (successes.length === 0) {
      return
    }

    const shouldSave = await confirm({
      message: `是否保存 ${successes.length} 条成功记录到 ${values.output}？`,
      default: true,
    })

    if (shouldSave) {
      saveRecords(values.output ?? DEFAULT_OUTPUT_PATH, successes.map((item) => item.record))
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    printUsage()
    process.exitCode = 1
  }
}

main()
