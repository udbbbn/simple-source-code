import { App } from './types'
import Sandbox from './sandbox'

const apps: App[] = []

export function define(
  tag: string,
  component: App['component'],
  route: string
) {
  /**
   * 原生自定义组件
   * https://developer.mozilla.org/zh-CN/docs/Web/API/Window/customElements
   */
  class Berial extends HTMLElement {
    static get componentName() {
      return tag
    }

    constructor() {
      super()
      /* 属性复制 */
      for (const k in component) {
        ;(this as any)[k] = (component as any)[k]
      }
      /* 自定义组件创建的代码被删除 意味着开发者必须在 html 文件中声明好 自定义组件并传入组件名 tag */
    }

    /* 自定义组件首次被插入 DOM 时触发 */
    connectedCallback() {
      this.attachShadow({ mode: 'open' })

      apps.push({
        tag,
        component,
        route,
        element: this,
      })

      invoke()
    }
  }

  const hasDef = window.customElements.get(tag)
  if (!hasDef) {
    window.customElements.define(tag, Berial)
  }
}

function invoke() {
  /* 此处做了一个代理 对 对象的属性做修改时 触发 process (调用组件生命钩子) */
  apps.forEach((app) => {
    /**
     * 这里代理 app.element 因为 host 对象最终会传给 html 中的对象 会调用 shadowRoot
     * 因为代理的缘故 最后从开发工具中也能从 app-one.count 中获取到值
     */
    const host = new Proxy(app.element, {
      get(target, key: string) {
        return target[key]
      },
      set(target, key: string, val) {
        target[key] = val
        process(app, host)
        return true
      },
    })
    process(app, host)
  })
}

function process(app: App, host: HTMLElement) {
  /* 根据路由去加载组件 */
  const path = window.location.hash || window.location.pathname || '/'

  if (app.route === path) {
    app.component.mount(host)
  } else {
    app.component.unmount(host)
  }
}

export const sandbox = Sandbox

window.addEventListener('hashchange', invoke)
window.addEventListener('popstate', invoke)
