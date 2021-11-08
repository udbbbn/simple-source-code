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
