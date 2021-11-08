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
  const definedLifecycles = new Map<keyof Lifecycle, boolean>()
  for (const key in lifecycle) {
    definedLifecycles.set(key as keyof Lifecycle, true)
  }
  if (!definedLifecycles.has('bootstrap')) {
    error(__DEV__, '看起来你没有导出 [bootstrap] 生命周期，这会导致发生错误')
  }
  if (!definedLifecycles.has('mount')) {
    error(__DEV__, '看起来你没有导出 [mount] 生命周期，这会导致发生错误')
  }
  if (!definedLifecycles.has('unmount')) {
    error(__DEV__, '看起来你没有导出 [unmount] 生命周期，这会导致发生错误')
  }
}

export function appendChildren<T extends HTMLElement | ShadowRoot>(
  element: T,
  children: Element[]
) {
  for (const child of children) {
    element.appendChild(child)
  }
}
