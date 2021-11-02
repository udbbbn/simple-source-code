import parseScript from './parseScript'
import runScript from './runScript'

/* WindowProxy 的相关解释在 runScript 头部 */
/* 后续 global 应该为各个子应用的沙箱 window */
export default async function loadScript(
  htmlEntry: string,
  global: WindowProxy = window
) {
  /* 解析 script */
  const { scriptUrls, scripts } = parseScript(htmlEntry)
  const fetchPromises = scriptUrls.map((url) => fetch(url, { mode: 'cors' }))
  /* 加载 script 并存入变量 */
  const scriptFromUrls = await Promise.all(fetchPromises).then((responses) => {
    let script: string[] = []
    responses.forEach((res) => {
      res.text().then((text) => (script = [...script, text]))
    })
    return script
  })

  const scriptToLoad = scriptFromUrls.concat(scripts)

  let bootstrap: Promise<void>[] = [],
    mount: Promise<void>[] = [],
    unmount: Promise<void>[] = []
  /* 执行 script 并将生命周期收集 */
  scriptToLoad.forEach((script) => {
    const lifecycle = runScript(script, global)

    bootstrap.push(lifecycle.bootstrap)
    mount.push(lifecycle.mount)
    unmount.push(lifecycle.unmount)
  })

  return {
    bootstrap,
    mount,
    unmount,
  }
}
