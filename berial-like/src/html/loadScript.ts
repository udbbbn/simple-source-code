import type { Lifecycles, PromiseFn } from 'src/types'
import { request } from 'src/utils'
import parseScript from './parseScript'
import runScript from './runScript'

/* WindowProxy 的相关解释在 runScript 头部 */
/* 后续 global 应该为各个子应用的沙箱 window */
export default async function loadScript(
  template: string,
  global: ProxyConstructor,
  name: string
): Promise<Lifecycles> {
  /* 解析 script */
  const { scriptURLs, scripts } = parseScript(template)
  /* 加载 script 并存入变量 */
  const fetchScripts = await Promise.all(scriptURLs.map((url) => request(url)))

  const scriptToLoad = fetchScripts.concat(scripts)

  let bootstrap: PromiseFn[] = []
  let mount: PromiseFn[] = []
  let unmount: PromiseFn[] = []
  let update: PromiseFn[] = []
  /* 执行 script 并将生命周期收集 */
  scriptToLoad.forEach((script) => {
    const lifecycle = runScript(script, global, name) || {}
    if (lifecycle) {
      bootstrap.push(lifecycle.bootstrap)
      mount.push(lifecycle.mount)
      unmount.push(lifecycle.unmount)
      update.push(lifecycle.update)
    }
  })

  return {
    bootstrap,
    mount,
    unmount,
    update,
  }
}
