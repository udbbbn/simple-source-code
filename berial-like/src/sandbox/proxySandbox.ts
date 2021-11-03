import { warn } from '../utils'

class ProxySandbox {
  isActivated = false
  proxyWindow: Record<PropertyKey, any>

  constructor(public global: Window) {
    const originalWindow = window
    const proxyWindow = createProxyWindow(global)
    this.proxyWindow = new Proxy(proxyWindow, {
      get: (target, key) => {
        if (!this.isActivated) {
          warn(
            __DEV__,
            '在沙盒失效时试图获取proxyWindow的属性是不正常的行为。如果你看到这个，请提交一个issus。'
          )
        }
        return proxyWindow[key] || originalWindow[key as keyof Window]
      },
      set: (target, key, val) => {
        if (!this.isActivated) {
          warn(
            __DEV__,
            '在沙盒失效时试图设置proxyWindow的属性是不正常的行为。如果你看到这个，请提交一个issus。'
          )
        }
        proxyWindow[key] = val
        return true
      },
      defineProperty: (...args) => {
        if (!this.isActivated) {
          warn(
            __DEV__,
            '在沙盒失效时试图定义proxyWindow的属性是不正常的行为。如果你看到这个，请提交一个issus。'
          )
        }
        Reflect.defineProperty(...args)
        return true
      },
    })
  }

  activate() {
    this.isActivated = true
  }

  deactivate() {
    this.isActivated = false
  }
}

function createProxyWindow(global: Window) {
  const proxyWindow: Record<PropertyKey, any> = {}
  Object.getOwnPropertyNames(global).forEach((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(global, name)
    /**
     * configurable 表示该属性可编辑
     * 这里跳过可编辑属性作用为 可编辑的属性直接挂载在 proxyWindow 上就可以
     * 将不可编辑的属性复制到 proxyWindow 中
     * 以复制一个完全独立的 新 window 对象
     */
    if (!descriptor || descriptor.configurable) return
    Object.defineProperty(proxyWindow, name, descriptor)
  })
  return proxyWindow
}

export default ProxySandbox
