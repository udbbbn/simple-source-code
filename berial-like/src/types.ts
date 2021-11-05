import { Status } from './app'

export type App = {
  name: string
  entry: ((props: App['props']) => Lifecycle) | string
  match: (location: Location) => boolean /* 路由 */
  host: Element /* dom 对象 */
  props: Record<string, unknown>
  status: Status
  loaded?: any /* 加载组件的主方法 -> 传入的加载方法 */
  loadLifecycle: any /* 传入的生命周期 | html? */
} & Lifecycle

export type Lifecycle = {
  /* 生命周期 */
  bootstrap: PromiseFn
  mount: PromiseFn
  unmount: PromiseFn
  update: PromiseFn
}

export type Lifecycles = ToArray<Lifecycle>

export type PromiseFn = (...arg: any[]) => Promise<any>

export type ToArray<T> = T extends Record<any, any>
  ? {
      [K in keyof T]: T[K][]
    }
  : unknown
