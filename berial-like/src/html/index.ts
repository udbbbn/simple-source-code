import type { App, Lifecycles } from 'src/types'
import loadScript from './loadScript'
import parseScript from './parseScript'
import runScript from './runScript'
import { proxy } from '../sandbox'
import { request } from 'src/utils'
import loadBody from './loadHTML'
import loadCSS from './loadCSS'

export async function importHTML(app: App): Promise<{
  lifecycle: Lifecycles
  styleNodes: HTMLStyleElement[]
  bodyNode: HTMLTemplateElement
}> {
  const template = await request(app.entry as string)
  const styleNodes = await loadCSS(template)
  const bodyNode = loadBody(template)
  const fake = proxy(window as any, null)
  const lifecycle = await loadScript(template, fake as any, app.name)
  return { lifecycle, styleNodes, bodyNode }
}

export { loadScript, parseScript, runScript }
