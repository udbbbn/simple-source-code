/**
 * 重写 sandbox
 * 原先方案依赖 iframe (dom结构被污染)
 * 现在的方案是 proxy window 对象 & 在调用时copy对象并重新代理 (比更早一个方案 直接复制整个 window 效率更高)
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
    get(target, key) {
      if (key === INTERNAL_STATE_KEY) return draftState

      if (key in proxiedKeyMap) return proxiedKeyMap[key]

      if (isObj(original[key as any]) && original[key as any] !== null) {
        proxiedKeyMap[key] = proxyProp(original[key as any], key, draftState)
        return proxiedKeyMap[key]
      }
    },
  })

  return draft
}

/* 对子属性对象做代理 */
function proxyProp(prop: any, key: any, host: any) {
  const { originalValue, draftValue, onWrite } = host
  return proxy(
    prop,
    (value: any) => {
      /**
       * 子级对象的修改 会一直往上调用 修改父级对象
       * 标记为 有变化的
       * 同时复制对象属性
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
      const desc = Reflect.getOwnPropertyDescriptor(source, key)
      if (!(key in target)) {
        target[key] = source[key]
      }
    })
  }
}

/* 基于 obj 的 prototype 去创建一个对象 */
function getCleanCopy(obj: any) {
  return Object.create(Object.getPrototypeOf(obj))
}

export async function loadSandbox(host: any) {
  const originalWindow = window
  const shadowRoot = patchShadowDOM(host)
  return new Promise(async (resolve) => {
    const iframe = await loadIframe()
    const proxy = new Proxy(iframe.contentWindow as WindowProxy, {
      get: (target: Record<PropertyKey, any>, key: string) => {
        switch (key) {
          case 'document':
            /**
             * 这个调整暂时还不是很理解
             * 从原先 host.shadowRoot 改为 proxy 对象
             */
            return shadowRoot
          case 'store':
            return host.store
          default:
            return key in target
              ? target[key]
              : originalWindow[key as keyof Window]
        }
      },
      set: (target: Record<PropertyKey, any>, key: string, val) => {
        target[key] = val
        return true
      },
    })
    resolve(proxy)
  })
}

async function loadIframe() {
  return new Promise<HTMLIFrameElement>((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = `position: absolute; top: -99999px; width: 1px; height: 1px`

    iframe.onload = () => resolve(iframe)
    document.body.append(iframe)
  })
}

function patchShadowDOM(host: Element) {
  return new Proxy(host.shadowRoot as ShadowRoot, {
    get(target: any, key: string) {
      return key in target ? target[key] : (document as any)[key]
    },
    set(target, key: string, val) {
      target[key] = val
      return true
    },
  })
}
