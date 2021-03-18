import { ReactDom } from './src'
import * as React from './src'

const Welcome = <h1>Hello, react-like</h1>

ReactDom.render(Welcome, document.querySelector('#root'))
// ReactDom.render(<Welcome />, document.querySelector('#root'))
