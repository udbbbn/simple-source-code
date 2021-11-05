import { getApps, Status } from 'src/app'

/**
 * 该文件暂时未使用
 * 看代码就是实现 update 钩子
 */

type Store = Record<PropertyKey, any>

let isUpdating = false

export function reactiveStore(store: Store) {
  return new Proxy(store, {
    get(target, key) {
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      Reflect.set(target, key, value)
      isUpdating = true
      /* reactiveStore 这里传入函数 暂时没看懂 */
      batchUpdate(reactiveStore)
      return true
    },
  })
}

function batchUpdate(store: Store) {
  if (isUpdating) return
  const apps = getApps()
  Promise.resolve().then(() => {
    apps.forEach(async (app) => {
      app.status = Status.UPDATING
      await app.update(store, apps)
      app.status = Status.UPDATE
    })
    isUpdating = false
  })
}
