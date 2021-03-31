declare global {
    namespace JSX {
        interface Element extends Vnode {}
    }

    namespace React {
        interface Component<P = {}, S = {}> extends ComponentLifeCycle<P, S> {}
        class Component<P, S> {
            setState<K extends keyof S>(
                state: ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null) | (Pick<S, K> | S | null),
                callback?: () => void
            ): void
            render?(): Vnode

            base?: HTMLElement
        }
    }
}

export type Vnode = {
    tag: string | Function
    attrs: Record<string, any>
    children: Vnode[]
}

export interface ComponentLifeCycle<P, SS> {
    componentWillMount?(): void
    componentDidMount?(): void
    shouldComponentUpdate?(nextProps: P, nextState: SS): boolean
    componentWillUnmount?(): void
}
