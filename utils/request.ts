import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { H3Event } from 'h3'
import { getCertificate } from './cookie'

interface RequestOptions extends Omit<AxiosRequestConfig, 'url' | 'method'> {
  withAuth?: boolean
  event?: H3Event
  cookies?: Record<string, string>
}

interface Response<T = any> {
  code: number
  message?: string
  data?: T
}

/**
 * 创建请求实例
 */
const instance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 处理响应数据
 */
const handleResponse = <T>(response: AxiosResponse): Promise<Response<T>> => {
  return Promise.resolve(response.data)
}

/**
 * 处理请求错误
 */
export function useResponseError(message: string): Response {
  return {
    code: -1,
    message: message || '请求失败',
  }
}

/**
 * 构建请求头，支持添加认证信息
 */
const buildHeaders = (
  options: RequestOptions
): Record<string, string | number | boolean> => {
  const headers: Record<string, string | number | boolean> = {
    ...((options.headers as Record<string, string | number | boolean>) || {}),
  }

  // 如果需要认证且提供了event
  if (options.withAuth && options.event) {
    const SESSDATA = getCertificate(options.event, 'SESSDATA')
    console.log(`🚀 SESSDATA:`, SESSDATA)
    const bili_jct = getCertificate(options.event, 'bili_jct')
    console.log(`🚀 bili_jct:`, bili_jct)

    headers.Cookie = `SESSDATA=${SESSDATA}; bili_jct=${bili_jct}`
  }

  // 如果直接提供了cookies
  if (options.cookies) {
    const cookieItems = Object.entries(options.cookies).map(
      ([key, value]) => `${key}=${value}`
    )
    headers.Cookie = cookieItems.join('; ')
  }

  return headers
}

/**
 * GET请求
 */
export const get = async <T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<Response<T>> => {
  return instance({
    url,
    method: 'GET',
    params: options.params,
    headers: buildHeaders(options),
    ...options,
  })
    .then(handleResponse<T>)
    .catch(useResponseError)
}

/**
 * POST请求
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  options: RequestOptions = {}
): Promise<Response<T>> => {
  return instance({
    url,
    method: 'POST',
    data,
    headers: buildHeaders(options),
    ...options,
  })
    .then(handleResponse<T>)
    .catch(useResponseError)
}

/**
 * 通用请求方法
 */
export const request = async <T = any>(
  config: AxiosRequestConfig & RequestOptions
): Promise<Response<T>> => {
  const headers = buildHeaders(config)

  return instance({
    ...config,
    headers,
  })
    .then(handleResponse<T>)
    .catch(useResponseError)
}

export default {
  get,
  post,
  request,
}
