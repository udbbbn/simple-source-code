import type { App } from 'src/types'
import loadScript from './loadScript'
import parseScript from './parseScript'
import runScript from './runScript'
import { loadSandbox } from '../sandbox'
import { request } from 'src/utils'
import loadBody from './loadHTML'
import loadCSS from './loadCSS'

export async function importHTML(app: App) {
  const template = await request(app.entry as string)
  const sandbox = (await loadSandbox(app.host)) as ProxyConstructor
  const lifecycle = await loadScript(template, sandbox, app.name)
  const styleNodes = await loadCSS(template)
  const bodyNode = loadBody(template)
  return { lifecycle, styleNodes, bodyNode }
}

export { loadScript, parseScript, runScript }
