/**
 * 重写 sandbox
 * 原先方案依赖 iframe (dom结构被污染)
 * 现在的方案是 proxy window 对象 & 在调用时copy对象并代理子对象 (比更早一个方案 直接复制整个 window 效率更高)
 *
 * 写这么麻烦的目的是为了解决对象内存在引用类型的值 其实也不麻烦 仔细思考之后发现这么写是合理的
 * 因为要深拷贝一个很大的对象 最好的办法就是 用到某一层级的时候去浅拷贝 不断的浅拷贝到最后就成了深拷贝
 */
const INTERNAL_STATE_KEY = Symbol('state')
const isArr = (x: unknown): x is any[] => Array.isArray(x)
const isObj = (x: unknown): x is object =>
  Object.prototype.toString.call(x) === '[object Object]'

export function proxy(
  original: Record<string, unknown>,
  onWrite: any,
  host: any
) {
  const draftValue = isArr(original) ? [] : getCleanCopy(original)
  const proxiedKeyMap = Object.create(null)
  const draftState = {
    originalValue: original,
    draftValue,
    mutated: false,
    onWrite,
  }

  const draft = new Proxy(original, {
    get(target, key, receiver) {
      if (key === INTERNAL_STATE_KEY) return draftState

      if (key in proxiedKeyMap) return proxiedKeyMap[key]

      if (isObj(original[key as any]) && original[key as any] !== null) {
        proxiedKeyMap[key] = proxyProp(original[key as any], key, draftState)
        return proxiedKeyMap[key]
      }

      if (draftState.mutated) return draftValue[key]
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value) {
      if (isObj(value)) {
        proxiedKeyMap[key] = proxyProp(value, key, draftState)
      }
      copyOnWrite(draftState)

      draftValue[key] = value
      return true
    },
    has(_, ...args) {
      return Reflect.has(getTarget(draftState), ...args)
    },
    ownKeys(_, ...args) {
      return Reflect.ownKeys(getTarget(draftState), ...args)
    },
    getOwnPropertyDescriptor(_, ...args) {
      return Reflect.getOwnPropertyDescriptor(getTarget(draftState), ...args)
    },
    getPrototypeOf(_, ...args) {
      return Reflect.getPrototypeOf(original, ...args)
    },
    deleteProperty(_, ...args) {
      copyOnWrite(draftState)
      return Reflect.deleteProperty(draftValue, ...args)
    },
    defineProperty(_, ...args) {
      copyOnWrite(draftState)
      return Reflect.defineProperty(draftValue, ...args)
    },
    setPrototypeOf(_, ...args) {
      copyOnWrite(draftState)
      return Reflect.setPrototypeOf(draftValue, ...args)
    },
  })

  return draft
}

/* 修改对象为 有变化的 同时复制对象属性 */
function copyOnWrite(draftState: any) {
  const { originalValue, draftValue, onWrite, mutated } = draftState
  if (!mutated) {
    draftState.mutated = true
    if (onWrite) {
      onWrite(draftValue)
    }
    copyProps(draftValue, originalValue)
  }
}

/* 对子属性对象做代理 */
function proxyProp(prop: any, key: any, host: any) {
  const { originalValue, draftValue, onWrite } = host
  return proxy(
    prop,
    (value: any) => {
      /**
       * 子级对象的修改 会一直往上调用 标记父级对象为 有变化的
       * 同时复制对象属性(避免污染全局)
       */
      if (!draftValue.mutated) {
        host.mutated = true
        copyProps(draftValue, originalValue)
      }
      draftValue[key] = value
      if (onWrite) {
        onWrite(draftValue)
      }
    },
    null
  )
}

/* 复制属性 */
function copyProps(target: any, source: any) {
  if (isArr(source)) {
    for (let i = 0; i < source.length; i++) {
      if (!(i in target)) {
        target[i] = source[i]
      }
    }
  } else {
    Reflect.ownKeys(source).forEach((key) => {
      const desc = Reflect.getOwnPropertyDescriptor(source, key) as any
      if (!(key in target)) {
        Object.defineProperty(target, key, desc)
      }
    })
  }
}

function getTarget(draftState: any) {
  return draftState.mutated ? draftState.draftValue : draftState.originalValue
}

/* 基于 obj 的 prototype 去创建一个对象 */
function getCleanCopy(obj: any) {
  return Object.create(Object.getPrototypeOf(obj))
}
