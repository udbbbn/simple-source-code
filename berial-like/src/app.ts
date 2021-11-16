import type { App, Lifecycle, Lifecycles } from './types'
import { importHTML } from './html'
import { appendChildren, lifecycleCheck } from './utils'

/* 生命周期 */
export enum Status {
  NOT_LOADED = 'NOT_LOADED',
  LOADING = 'LOADING',
  NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED',
  BOOTSTRAPPING = 'BOOTSTRAPPING',
  NOT_MOUNTED = 'NOT_MOUNTED',
  MOUNTING = 'MOUNTING',
  MOUNTED = 'MOUNTED',
  UPDATING = 'UPDATING',
  UPDATE = 'UPDATE',
  UNMOUNTING = 'UNMOUNTING',
}

let started = false
const apps: any = new Set()
const deps: any = new Set()

export function register(
  name: App['name'],
  entry: App['entry'],
  match: App['match']
): void {
  apps.add({
    name,
    entry,
    match,
    status: Status.NOT_LOADED,
  } as App)
}

export function start(store: any = {}): void {
  started = true
  reroute(store)
}

/* 加载所有应用并跑钩子 */
function reroute(store: any): Promise<void> {
  const { loads, mounts, unmounts } = getAppChanges()
  if (started) {
    return perform()
  } else {
    return init()
  }
  async function init() {
    await Promise.all(loads.map(runLoad))
  }
  async function perform() {
    unmounts.map(runUnmount)
    loads.map(async (app) => {
      app = await runLoad(app, store)
      app = await runBootstrap(app)
      return runMount(app)
    })
    mounts.map(async (app) => {
      app = await runBootstrap(app)
      return runMount(app)
    })
  }
}

/* 分类当前应用至 load mount unmount  */
function getAppChanges() {
  const loads: App[] = []
  const mounts: App[] = []
  const unmounts: App[] = []
  apps.forEach((app: App) => {
    const isActive = app.match(window.location)
    /**
     * MOUNTING 跟 UNMOUNTING 没有包含在这个 switch 分支内的原因
     * 1. MOUNTING
     * 没有 MOUNTING 的原因应该是避免 mount 钩子被重复调用
     * 就算 MOUTING 状态的子应用 push 进 mounts 数组
     * 也是走 MOUNT 流程
     *
     * 2. UNMOUNTING
     * 正在走 UNMOUNT 流程不能 跟 NOT_MOUNTED 一样 push 进 mounts 数组
     * 否则不能保证 mount unmount 两个生命周期执行顺序
     */
    switch (app.status) {
      case Status.NOT_LOADED:
      case Status.LOADING:
        isActive && loads.push(app)
        break
      case Status.NOT_BOOTSTRAPPED:
      case Status.BOOTSTRAPPING:
      case Status.NOT_MOUNTED:
        isActive && mounts.push(app)
        break
      case Status.MOUNTED:
        !isActive && unmounts.push(app)
    }
  })
  return {
    loads,
    mounts,
    unmounts,
  }
}

/**
 * 加载应用
 * async 的函数会返回 promise
 * 函数内返回 app.loaded 也是返回了一个 promise 并在该 promise 内返回了 app
 */
async function runLoad(app: App, store: any): Promise<any> {
  if (app.loaded) {
    return app.loaded
  }
  app.loaded = Promise.resolve().then(async () => {
    app.status = Status.LOADING
    let lifecycle: Lifecycles
    let host = await loadShadowDOM(app, store)
    app.host = host as Element
    let bodyNode: HTMLTemplateElement
    let styleNodes: HTMLStyleElement[] = []
    if (typeof app.entry === 'string') {
      const exports = await importHTML(app)
      lifecycleCheck(exports.lifecycle)
      lifecycle = exports.lifecycle
      bodyNode = exports.bodyNode
      styleNodes = exports.styleNodes

      host.shadowRoot?.appendChild(bodyNode.content.cloneNode(true))
      for (const k of styleNodes) {
        host.shadowRoot?.insertBefore(k, host.shadowRoot.firstChild)
      }
    } else {
      const exportLifecycles = (await app.entry(app)) as Lifecycle
      const { bootstrap, mount, unmount, update } = exportLifecycles
      /**
       * 这里其实可以直接让 lifecycle = exportLifecycles
       * 等 compose 方法将钩子转为数组
       * 但是从类型上会产生误解 (Lifecycle | Lifecycless)
       */
      lifecycle = {} as Lifecycles
      lifecycle.bootstrap = [bootstrap]
      lifecycle.mount = [mount]
      lifecycle.unmount = [unmount]
      lifecycle.update = [update]
    }
    // appendChildren(host.shadowRoot!, [...styleNodes!, bodyNode!])
    app.status = Status.NOT_BOOTSTRAPPED
    app.bootstrap = compose(lifecycle!.bootstrap)
    app.mount = compose(lifecycle!.mount)
    app.unmount = compose(lifecycle!.unmount)
    app.update = compose(lifecycle!.update)
    delete app.loaded
    return app
  })
  return app.loaded
}

/* 调用 bootstrap 钩子 */
async function runBootstrap(app: App): Promise<App> {
  if (app.status !== Status.NOT_BOOTSTRAPPED) {
    return app
  }
  app.status = Status.BOOTSTRAPPING
  await app.bootstrap(app)
  app.status = Status.NOT_MOUNTED
  return app
}

/* 挂载 */
async function runMount(app: App): Promise<App> {
  if (app.status !== Status.NOT_MOUNTED) {
    return app
  }
  app.status = Status.MOUNTING
  await app.mount(app)
  app.status = Status.MOUNTED
  return app
}

/* 卸载 */
async function runUnmount(app: App): Promise<App> {
  if (app.status !== Status.MOUNTED) {
    return app
  }
  app.status = Status.UNMOUNTING
  await app.unmount(app)
  app.status = Status.NOT_MOUNTED
  return app
}

/* 创建原生自定义组件 */
async function loadShadowDOM(app: App, store: any): Promise<HTMLElement> {
  return new Promise<HTMLElement>((resolve, reject) => {
    try {
      class Berial extends HTMLElement {
        static get tag() {
          return app.name
        }
        connectedCallback() {
          resolve(this)
        }
        store: any
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
          this.store = loadStore(app, store)
        }
      }
      const hasDef = window.customElements.get(app.name)
      if (!hasDef) {
        customElements.define(app.name, Berial)
      }
    } catch (e) {
      reject(e)
    }
  })
}

function loadStore(app: any, store: any) {
  return new Proxy(store, {
    get(target, key) {
      const has = app.deps.has(app)
      if (!has) {
        deps.add(app)
      }
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      deps.forEach((app: App) => app.update(app))
      return true
    },
  })
}

function compose(
  fns: ((props: App) => Promise<any>)[]
): (app: App) => Promise<void> {
  fns = Array.isArray(fns) ? fns : [fns]
  return (props: App) =>
    fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve())
}

/* -------- 原生事件监听劫持 --------- */
/**
 * 目前并没有根据子应用的 key 去区分监听回调
 * 意味着 卸载子应用时无法清除子应用相关的回调
 *
 * 此处理解不一定正确
 */
function urlReroute(): void {
  reroute({})
}

window.addEventListener('hashchange', urlReroute)
window.addEventListener('popstate', urlReroute)

const routingEventsListeningTo = ['hashchange', 'popstate']
const capturedEventListeners = {
  hashchange: [],
  popstate: [],
} as any

const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener
window.addEventListener = function (name: string, fn: any, ...args: any): void {
  if (
    routingEventsListeningTo.indexOf(name) >= 0 &&
    !capturedEventListeners[name].some((f: any) => f == fn)
  ) {
    capturedEventListeners[name].push(fn)
    return
  }
  return originalAddEventListener.apply(this, args)
}
window.removeEventListener = function (
  name: string,
  fn: any,
  ...args: any
): void {
  if (routingEventsListeningTo.indexOf(name) >= 0) {
    capturedEventListeners[name] = capturedEventListeners[name].filter(
      (f: any) => f !== fn
    )
    return
  }
  return originalRemoveEventListener.apply(this, args)
}
/* 该方法为了确保同 url 不会重复跑钩子函数 */
function patchedUpdateState(updateState: any): (...arg: any) => void {
  return function (...args) {
    const urlBefore = window.location.href

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    updateState.apply(this, args)

    const urlAfter = window.location.href

    if (urlBefore !== urlAfter) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      urlReroute(new PopStateEvent('popstate'))
    }
  }
}

window.history.pushState = patchedUpdateState(window.history.pushState)
window.history.replaceState = patchedUpdateState(window.history.replaceState)
