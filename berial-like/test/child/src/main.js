import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

if (!window.IS_BERIAL_LIKE_SANDBOX) {
  // new Vue({
  //   render: (h) => h(App),
  // }).$mount('#app')
}

export async function bootstrap() {
  console.log('bootstrap')
}

export async function mount({ host }) {
  console.log('mount', host)
  new Vue({
    render: (h) => h(App),
  }).$mount('#app')
}

export async function unmount() {
  console.log('unmount')
}

console.log(21323132132312312)
