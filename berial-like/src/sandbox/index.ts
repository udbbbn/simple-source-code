import { getGlobalStore } from 'src/app'

export async function loadSandbox(host: Element) {
  const originalWindow = window
  patchShadowDOM(host)
  return new Promise(async (resolve) => {
    const iframe = await loadIframe()
    const proxy = new Proxy(iframe.contentWindow as WindowProxy, {
      get: (target: Record<PropertyKey, any>, key: string) => {
        switch (key) {
          case 'document':
            return host.shadowRoot
          case 'globalStore':
            return getGlobalStore()
          default:
            return target[key] || originalWindow[key as keyof Window]
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
      return target[key] || (document as any)[key]
    },
    set(target, key: string, val) {
      target[key] = val
      return true
    },
  })
}
