import { PromiseFn } from '../types'

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
) {
  let bootstrap!: PromiseFn
  let mount!: PromiseFn
  let unmount!: PromiseFn
  let update!: PromiseFn

  /* 暂时使用 log 来避免变量被 tree shaking */
  console.log('umdName', umdName, global)

  eval(`(function(window, umdName){
      ${script};
      bootstrap = window[umdName].bootstrap;
      mount = window[umdName].mount;
      unmount = window[umdName].unmount;
      update = window[umdName].update;
  })(global, umdName)`)

  return {
    bootstrap,
    mount,
    unmount,
    update,
  }
}
