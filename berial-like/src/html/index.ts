import loadScript from './loadScript'
import parseScript from './parseScript'
import runScript from './runScript'
import loadAndReplaceHTMLs from './loadHTML'
import { loadSandbox } from '../sandbox'
import { App } from 'src/types'

export async function importHTML(app: App) {
  /* replacedTemplate 当前版本似乎没派上用场 */
  const loadedHTMLs = await loadAndReplaceHTMLs([
    { name: app.name, url: app.entry },
  ])
  const { originalTemplate } = loadedHTMLs[app.name]
  const sandbox = (await loadSandbox(app.host)) as ProxyConstructor
  return await loadScript(originalTemplate, sandbox, app.name)
}

export { loadAndReplaceHTMLs, loadScript, parseScript, runScript }
