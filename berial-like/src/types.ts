export type App = {
  tag: string
  component: {
    mount: (host: HTMLElement) => void
    unmount: (host: HTMLElement) => void
  }
  route: string
  element: HTMLElement & Record<string, any>
}
