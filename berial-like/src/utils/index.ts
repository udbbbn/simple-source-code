export function warn(trigger: boolean): void
export function warn(trigger: string): void | Error
export function warn(trigger: boolean, msg?: string): void | Error
export function warn(trigger: boolean | string, msg?: string) {
  if (typeof trigger === 'string') msg = trigger
  if (!trigger) return
  throw new Error(`[Berial-Like Warning]: ${msg}`)
}

export function error(trigger: boolean): void
export function error(trigger: string): void | Error
export function error(trigger: boolean, msg?: string): void | Error
export function error(trigger: boolean | string, msg?: string) {
  if (typeof trigger === 'string') msg = trigger
  if (!trigger) return
  throw new Error(`[Berial-Like Error]: ${msg}`)
}

export function request(url: string, options?: RequestInit) {
  if (!window.fetch) {
    error('当前浏览器不支持原生 fetch. 请使用 Polyfill')
  }

  return fetch(url, {
    mode: 'cors',
    ...options,
  })
    .then((res) => res.text())
    .then((data) => data)
}
