import { createApp } from 'vue'
import App from './App.vue'

function render(container = '#app') {
  const app = createApp(App)
  app.mount(container)
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
    render(host.shadowRoot.querySelector('#app'))
  }
  static async umount() {
    console.log('umount')
  }
}
