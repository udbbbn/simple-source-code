import { error } from './error'

function request(url: string, options?: RequestInit) {
  if (!window.fetch) {
    error('当前浏览器不支持原生 fetch. 请使用 Polyfill')
  }

  return fetch(url, {
    mode: 'cors',
    ...options,
  })
}

export function fetchURL(url: string) {
  const fetchPromise = request(url)
  return fetchPromise.then((res) => {
    return res.text()
  })
}

export default request
