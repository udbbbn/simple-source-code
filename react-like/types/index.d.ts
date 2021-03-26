declare global {
    namespace JSX {
        interface Element extends ReactElement {}
    }
}

export type Vnode = {
    tag: string | Function
    attrs: Record<string, any>
    children: Vnode[]
}

export {}
