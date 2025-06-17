import { AxiosResponse } from 'axios'

interface Response<T = any> {
  code: number
  message?: string
  data?: T
}

/**
 * 处理响应数据
 */
export const useResponseData = <T>(
  response: AxiosResponse
): Promise<Response<T>> => {
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
