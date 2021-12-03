import { Lifecycles, Lifecycle } from 'src/types'

const mixins: any = new Set()
const plugins: any = new Set()

export function use(plugin: () => any): void {
  if (!plugins.has(plugin)) {
    plugins.add(plugin)
    plugin()
  }
}

export function mixin(mix: any): void {
  console.log('mixins before', mixins, 'mixin', mix)
  if (!mixins.has(mix)) {
    mixins.add(mix)
    console.log('mixins after', mixins)
  }
}

export function mapMixin() {
  const out: Lifecycles = {
    load: [],
    bootstrap: [],
    mount: [],
    unmount: [],
  }

  console.log('mapMixin mixins', mixins)

  mixins.forEach((item: Lifecycle) => {
    item.load && out.load!.push(item.load)
    item.bootstrap && out.bootstrap.push(item.bootstrap)
    item.mount && out.mount.push(item.mount)
    item.unmount && out.unmount.push(item.unmount)
  })

  return out
}
