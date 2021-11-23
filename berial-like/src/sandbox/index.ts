/**
 * 重写 sandbox
 *
 * 这版本使用 immutable 同样的方式
 * 修改过的值就开辟新的内存 没修改过的值直接复用
 */
const IS_SANDBOX = 'IS_BERIAL_LIKE_SANDBOX'
const isArr = (x: unknown): x is any[] => Array.isArray(x)
const isObj = (x: unknown): x is object =>
  Object.prototype.toString.call(x) === '[object Object]'

export function proxy(
  original: Record<string, any>,
  onWrite: any
): Record<string, any> {
  const copy = isArr(original) ? [] : getCleanCopy(original)
  const map = Object.create(null)
  const draft = {
    original,
    copy,
    onWrite,
  }

  return new Proxy(original, {
    get<T extends string, U extends Record<string, any>>(
      target: U,
      key: T
    ): U[T] | boolean {
      if (key === IS_SANDBOX) return true
      if (key in map) return map[key]

      if (isObj(original[key]) || isArr(original[key])) {
        map[key] = proxy(
          original[key],
          (obj: Record<string, unknown>) => (copy[key] = obj)
        )
        return map[key]
      }
      return copy[key] || target[key]
    },
    set(target, key: string, value): boolean {
      if (isObj(original[key]) || isArr(original[key])) {
        map[key] = proxy(
          value,
          (obj: Record<string, unknown>) => (copy[key] = obj)
        )
      }
      onWrite && onWrite(draft.onWrite)
      copy[key] = value
      return true
    },
  })
}

/* 基于 obj 的 prototype 去创建一个对象 */
function getCleanCopy(obj: Record<string, unknown>): Record<PropertyKey, any> {
  return Object.create(Object.getPrototypeOf(obj))
}
