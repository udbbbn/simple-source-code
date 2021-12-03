import React from 'react'
import ReactDOM from 'react-dom'
import App from './App.jsx'
import { load } from './bridge-event'

if (!window.IS_BERIAL_LIKE_SANDBOX) {
  ReactDOM.render(<App />, document.getElementById('root'))
}

export async function bootstrap({ host }) {
  load(host.shadowRoot)
  console.log('react bootstrap')
}

export async function mount({ host }) {
  console.log('react mount')

  ReactDOM.render(<App />, host.shadowRoot.getElementById('root'))
}

export async function unmount({ host }) {
  console.log('react unmount')

  const root = host.shadowRoot.getElementById('root')
  // 从 DOM 中卸载组件
  ReactDOM.unmountComponentAtNode(root)
}
