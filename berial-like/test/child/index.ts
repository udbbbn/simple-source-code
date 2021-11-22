import { createApp } from 'vue'
import App from './App.vue'

let mountEl = null

function render(container = '#app') {
  const app = createApp(App)
  app.mount(container)
  return app
}

if (!(window as any).IS_BERIAL_LIKE_SANDBOX) {
  render()
}

/**
 * parcelV2 不支持umd模块打包
 * 故 手动umd导出
 */
window['child-app'] = class {
  static async bootstrap() {
    console.log('bootstrap')
  }
  static async mount({ host }) {
    console.log('mount')
    console.log(host.shadowRoot)
    mountEl = render(host.shadowRoot.querySelector('#app'))
    console.log('mountEl', mountEl.unmount)
  }
  static async unmount() {
    console.log('unmount')
    mountEl.unmount()
    mountEl = null
  }
}
