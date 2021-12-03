import type { App, Lifecycle, Lifecycles, PromiseFn } from './types'
import { importHTML } from './html'
import { lifecycleCheck } from './utils'
import { mapMixin } from './mixin'

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

export function start(): void {
  started = true
  polyfillRouter()
  reroute()
}

/* 加载所有应用并跑钩子 */
function reroute(): Promise<void> {
  const { loads, mounts, unmounts } = getAppChanges()
  return started ? perform() : init()
  async function init() {
    await Promise.all(loads.map(runLoad))
  }
  async function perform() {
    unmounts.map(runUnmount)
    loads.map(async (app) => {
      app = await runLoad(app)
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
async function runLoad(app: App): Promise<any> {
  if (app.loaded) {
    return app.loaded
  }
  app.loaded = Promise.resolve().then(async () => {
    app.status = Status.LOADING
    let selfLife: Lifecycles
    let bodyNode: HTMLTemplateElement
    let styleNodes: HTMLStyleElement[] = []
    const mixinLife = mapMixin()
    let host = await loadShadowDOM(app)
    app.host = host as Element
    if (typeof app.entry === 'string') {
      const exports = await importHTML(app)
      lifecycleCheck(exports.lifecycle)
      selfLife = exports.lifecycle
      bodyNode = exports.bodyNode
      styleNodes = exports.styleNodes

      host.shadowRoot?.appendChild(bodyNode.content.cloneNode(true))
      for (const k of styleNodes) {
        host.shadowRoot?.insertBefore(k, host.shadowRoot.firstChild)
      }
    } else {
      const exportLifecycles = (await app.entry(app)) as Lifecycle
      const { bootstrap, mount, unmount } = exportLifecycles
      /**
       * 这里其实可以直接让 lifecycle = exportLifecycles
       * 等 compose 方法将钩子转为数组
       * 但是从类型上会产生误解 (Lifecycle | Lifecycless)
       */
      selfLife = {} as Lifecycles
      selfLife.bootstrap = [bootstrap]
      selfLife.mount = [mount]
      selfLife.unmount = [unmount]
    }
    mixinLife.load!.length &&
      (await compose(mixinLife.load as PromiseFn[])(app))
    app.status = Status.NOT_BOOTSTRAPPED
    app.bootstrap = compose(mixinLife.bootstrap.concat(selfLife.bootstrap))
    app.mount = compose(mixinLife.mount.concat(selfLife.mount))
    app.unmount = compose(mixinLife.unmount.concat(selfLife.unmount))
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
async function loadShadowDOM(app: App): Promise<HTMLElement> {
  return new Promise<HTMLElement>((resolve, reject) => {
    try {
      class Berial extends HTMLElement {
        static get tag() {
          return app.name
        }
        connectedCallback() {
          resolve(this)
        }
        constructor() {
          super()
          this.attachShadow({ mode: 'open' })
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
 *
 * 理解是正确的 是没清除 但是 window 是个代理对象
 * 加载新的子应用会使用一个新的 window 代理对象
 * 旧的将会等待被垃圾回收
 */

function polyfillRouter() {
  window.addEventListener('hashchange', reroute)
  window.addEventListener('popstate', reroute)

  const events = ['hashchange', 'popstate']
  const captured = {
    hashchange: [],
    popstate: [],
  } as any

  const oldAEL = window.addEventListener
  const oldREL = window.removeEventListener
  window.addEventListener = function (
    name: string,
    fn: any,
    ...args: any
  ): void {
    if (
      events.indexOf(name) >= 0 &&
      !captured[name].some((f: any) => f == fn)
    ) {
      captured[name].push(fn)
      return
    }
    return oldAEL.apply(this, [name, fn, ...args] as any)
  }

  window.removeEventListener = function (
    name: string,
    fn: any,
    ...args: any
  ): void {
    if (events.indexOf(name) >= 0) {
      captured[name] = captured[name].filter((f: any) => f !== fn)
      return
    }
    return oldREL.apply(this, [name, fn, ...args] as any)
  }
  // /* 该方法为了确保同 url 不会重复跑钩子函数 */
  function polyfillRoute(updateState: any): (...arg: any) => void {
    return function (...args) {
      const urlBefore = window.location.href

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      updateState.apply(this, args)

      const urlAfter = window.location.href

      if (urlBefore !== urlAfter) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        reroute(new PopStateEvent('popstate'))
      }
    }
  }

  window.history.pushState = polyfillRoute(window.history.pushState)
  window.history.replaceState = polyfillRoute(window.history.replaceState)
}
