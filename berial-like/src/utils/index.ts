import type { Lifecycle, Lifecycles } from 'src/types'

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

export function lifecycleCheck(lifecycle: Lifecycle | Lifecycles) {
  const keys = ['bootstrap', 'mount', 'unmount']
  keys.forEach((key) => {
    if (!(key in lifecycle)) {
      error(
        `It looks like that you didn't export the lifecycle hook [${key}], which would cause a mistake.`
      )
    }
  })
}

export function appendChildren<T extends HTMLElement | ShadowRoot>(
  element: T,
  children: Element[]
) {
  for (const child of children) {
    element.appendChild(child)
  }
}
