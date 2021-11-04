import { getApps } from 'src/app'

/**
 * 该文件暂时未使用
 * 看代码就是实现 update 钩子
 */

type Store = Record<PropertyKey, any>

let isUpdating = false

export function reactive(store: Store) {
  const reactiveStore = new Proxy(store, {
    get(target, key) {
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      Reflect.set(target, key, value)
      isUpdating = true
      batchUpdate(reactiveStore)
      return true
    },
  })
}

function batchUpdate(store: Store) {
  if (isUpdating) return
  const apps = getApps()
  Promise.resolve().then(() => {
    apps.forEach((app) => {
      app.update()
    })
    isUpdating = false
  })
}
