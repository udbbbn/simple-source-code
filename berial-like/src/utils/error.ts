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
