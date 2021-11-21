import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

function render(container) {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    container || document.getElementById('root')
  )
  reportWebVitals()
}

if (!window.IS_BERIAL_LIKE_SANDBOX) {
  render()
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

export async function bootstrap() {
  console.log('react bootstrap')
}

export async function mount({ host }) {
  console.log('react mount')
  render(host.shadowRoot.querySelector('#root'))
}

export async function unmount({ host }) {
  console.log('react unmout')

  const root = host.shadowRoot.getElementById('root')
  // 从 DOM 中卸载组件
  ReactDOM.unmountComponentAtNode(root)
}
