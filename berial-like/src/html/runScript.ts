import { Lifecycle, PromiseFn } from '../types'

/**
 * 这里注意 WindowProxy
 * WindowProxy 对象委托给当前窗口 当我们获取 Window 对象时
 * 其实获取的时 WindowProxy 对象
 * https://www.w3.org/TR/2009/WD-html5-20090423/browsers.html
 * https://stackoverflow.com/questions/16092835/windowproxy-and-window-objects
 */
export default function runScript(
  script: string,
  //   global: WindowProxy = window,
  global: ProxyConstructor,
  umdName: string
): Lifecycle {
  const resolver = new Function(
    'window',
    `
      try {
        ${script};
        return window['${umdName}']
      }
      catch(e) {
        console.log(e)
      }
  `
  )
  return resolver.call(global, global)
}
