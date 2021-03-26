import * as React from './index'

class Context<T> {
    state = {}

    constructor(defaultValue: T) {
        this.state = { ...defaultValue }
    }

    // 需要用箭头函数 或 bind 绑定当前 this
    // 否则 会将 this 绑定到 React 对象上
    Provider = (props: { value: T; children? }) => {
        this.state = { ...props.value }

        return props.children
    }

    Consumer = props => {
        console.log(props, this.state)

        return props.children(this.state)
    }
}

export function createContext<T>(defaultValue: T) {
    const ctx = new Context<T>(defaultValue)

    return ctx
}
