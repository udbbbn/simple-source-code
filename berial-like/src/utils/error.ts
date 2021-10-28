export function warn(trigger: string | boolean, msg: string) {
  if (typeof trigger === 'string') msg = trigger
  if (!trigger) return
  throw new Error(`[Berial-Like Warning]: ${msg}`)
}

export function error(trigger: string | boolean, msg: string) {
  if (typeof trigger === 'string') msg = trigger
  if (!trigger) return
  throw new Error(`[Berial-Like Error]: ${msg}`)
}
