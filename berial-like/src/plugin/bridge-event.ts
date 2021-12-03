/**
 * 解决 react 中 shadowRoot 内的事件无法被监听触发
 * 原因是 react 把事件统一监听到 document 元素
 * (react18之后会把事件都监听到root元素上就不需要这个 polyfill 了)
 *
 * 原理是
 * react 发现元素是 shadowRoot 时会调用 Element.getRootNode 去绑定事件到 rootNode 上
 * 此处也是手动 dispatchEvent 到 shadowRoot.host 上
 * https://github.com/Houfeng/shadow-view/blob/master/src/EventBridge.ts
 */

/**
 * 该插件使用流程
 * 1. 发布 npm 包 例如: berial-react-event-plugin
 * 2. react 子应用导入并在 bootstrap 时调用 load(host.shadowRoot)
 *
 * 原意是想使用 mixin 挂载 但是有个问题:
 * 父应用引入的 berial-like 跟 子应用 berial-like 的 mixin 不会是同一个
 * 所以无法调用 此处 132 没有给出 demo
 * 以下为本来思路:
 * 此处做学习 不发布 使用 npm-link
 * 1. cd berial-like
 *    npm link
 * 2. cd test/child-react
 *    npm link berial-like
 * 3. 复制该文件至 react 子应用 并调用 mixin
 *
 */
import { mixin } from '../../dist/es/index.esm.js'

export function bridgeEvent(): void {
  mixin({ load })
}

export function load(shadowRoot: ShadowRoot): void {
  const define = Object.defineProperty
  const fromNode = shadowRoot,
    toNode = shadowRoot.host
  BRIDGE_EVENT_NAMES.map((eventName) => {
    fromNode.addEventListener(eventName, (fromEvent) => {
      fromEvent.stopPropagation()
      const Event = fromEvent.constructor
      // @ts-ignore
      const toEvent = new Event(eventName, {
        ...fromEvent,
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      const {
        path = [],
        target = path[0],
        srcElement = path[0],
        toElement = path[0],
        preventDefault,
      } = fromEvent as any
      define(toEvent, 'path', { get: () => path })
      define(toEvent, 'target', { get: () => target })
      define(toEvent, 'srcElement', { get: () => srcElement })
      define(toEvent, 'toElement', { get: () => toElement })
      define(toEvent, 'preventDefault', {
        value: () => {
          preventDefault.call(fromEvent)
          return preventDefault.call(toEvent)
        },
      })
      toNode.dispatchEvent(toEvent)
    })
  })
}

export const BRIDGE_EVENT_NAMES = [
  'abort',
  'animationcancel',
  'animationend',
  'animationiteration',
  'auxclick',
  'blur',
  'change',
  'click',
  'close',
  'contextmenu',
  'doubleclick',
  'error',
  'focus',
  'gotpointercapture',
  'input',
  'keydown',
  'keypress',
  'keyup',
  'load',
  'loadend',
  'loadstart',
  'lostpointercapture',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'reset',
  'resize',
  'scroll',
  'select',
  'selectionchange',
  'selectstart',
  'submit',
  'touchcancel',
  'touchmove',
  'touchstart',
  'transitioncancel',
  'transitionend',
  'drag',
  'dragend',
  'dragenter',
  'dragexit',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'focusout',
]
