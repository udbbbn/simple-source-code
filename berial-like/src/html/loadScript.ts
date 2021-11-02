import { PromiseFn } from 'src/types'
import { fetchURL } from 'src/utils/fetch'
import parseScript from './parseScript'
import runScript from './runScript'

interface ScriptExports {
  bootstrap: PromiseFn[]
  mount: PromiseFn[]
  unmount: PromiseFn[]
  update: PromiseFn[]
}

/* WindowProxy 的相关解释在 runScript 头部 */
/* 后续 global 应该为各个子应用的沙箱 window */
export default async function loadScript(
  template: string,
  global: WindowProxy = window
): Promise<ScriptExports> {
  /* 解析 script */
  const { scriptURLs, scripts } = parseScript(template)
  /* 加载 script 并存入变量 */
  const fetchScripts = await Promise.all(scriptURLs.map((url) => fetchURL(url)))

  const scriptToLoad = fetchScripts.concat(scripts)

  let bootstrap: PromiseFn[] = [],
    mount: PromiseFn[] = [],
    unmount: PromiseFn[] = [],
    update: PromiseFn[] = []
  /* 执行 script 并将生命周期收集 */
  scriptToLoad.forEach((script) => {
    const lifecycle = runScript(script, global)

    bootstrap.push(lifecycle.bootstrap)
    mount.push(lifecycle.mount)
    unmount.push(lifecycle.unmount)
    update.push(lifecycle.update)
  })

  return {
    bootstrap,
    mount,
    unmount,
    update,
  }
}
