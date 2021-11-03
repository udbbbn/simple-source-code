import loadScript from './loadScript'
import parseScript from './parseScript'
import runScript from './runScript'
import loadAndReplaceHTMLs from './loadHTML'
import createSandbox from '../sandbox'

export async function importHTML(url: string, name: string) {
  /* replacedTemplate 当前版本似乎没派上用场 */
  const loadedHTMLs = await loadAndReplaceHTMLs([{ name, url }])
  const { originalTemplate } = loadedHTMLs[name]
  const { sandbox, mount } = createSandbox()
  mount()
  return await loadScript(originalTemplate, sandbox.proxyWindow, name)
}

export { loadAndReplaceHTMLs, loadScript, parseScript, runScript }
