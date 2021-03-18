declare global {
    namespace JSX {
        interface Element extends ReactElement {}
    }
}

export type Vnode = {
    tag: string
    attrs: Record<string, any>
    children: Vnode[]
}

export {}
