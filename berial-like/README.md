# berial-Like

> micro frontend framework.

### Feature

- shadow dom

- scoped css

- js sandbox

- html loader

### Use

```shell
yarn run serve
```

```html
<one-app></one-app>
<two-app></two-app>
<three-app></three-app>
```

```js
import { register, start } from 'berial'

register(
  'one-app',
  async (props) => {
    console.log('加载时执行1')
    return {
      bootstrap: async (props) => {
        console.log('bootstrap1')
      },

      mount: async (props) => {
        console.log('mount1')
      },
      unmount: async (props) => {
        console.log('unmount1')
      },
    }
  },
  (location) => location.hash === '#/app1'
)
register(
  'two-app',
  async (props) => {
    console.log('加载时执行2')
    return {
      bootstrap: async (props) => {
        console.log('bootstrap2')
      },
      mount: async (props) => {
        console.log('mount2')
      },
      unmount: async (props) => {
        console.log('unmount2')
      },
    }
  },
  (location) => location.hash === '#/app2'
)
register(
  'three-app',
  'http://localhost:1234/umd.html',
  (location) => location.hash === '#/app3'
)
start()
```