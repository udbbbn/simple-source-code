import loadScript from './loadScript'
import parseScript from './parseScript'
import runScript from './runScript'
import loadAndReplaceHTMLs from './loadHTML'
import { loadSandbox } from '../sandbox'

export async function importHTML(url: string, name: string) {
  /* replacedTemplate 当前版本似乎没派上用场 */
  const loadedHTMLs = await loadAndReplaceHTMLs([{ name, url }])
  const { originalTemplate } = loadedHTMLs[name]
  const sandbox = (await loadSandbox()) as ProxyConstructor
  return await loadScript(originalTemplate, sandbox, name)
}

export { loadAndReplaceHTMLs, loadScript, parseScript, runScript }
