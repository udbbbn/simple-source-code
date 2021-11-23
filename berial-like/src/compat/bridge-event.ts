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

import { options } from 'src/app'

// options.bridgeEvent =
export function bridgeEvent(shadowRoot: ShadowRoot): void {
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
