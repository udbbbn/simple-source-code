export type App = {
  name: string
  entry: any
  match: any /* 路由 */
  host: HTMLElement /* dom 对象 */
  props: Record<string, unknown>
  status: string
  loaded?: any /* 加载组件的主方法 -> 传入的加载方法 */
  loadLifecycle: any /* 传入的生命周期 | html? */
} & Lifecycle

export type Lifecycle = {
  /* 生命周期 */
  bootstrap: any
  mount: any
  unmount: any
}

export type PromiseFn = (...arg: any[]) => Promise<any>
