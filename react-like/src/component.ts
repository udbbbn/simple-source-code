import { render } from './dom'

const _renderCallBacks = []

// render 后的回调
export const executeRenderCallBack = () => {
    while (_renderCallBacks.length) {
        const func = _renderCallBacks.shift()
        func()
    }
}

class Component {
    // 这里应该提供范型 但是先 any
    state: Record<string, any>
    props: Record<string, any>

    constructor(props = {}) {
        this.state = {}
        this.props = props
    }

    setState(nextState) {
        this.state = { ...this.state, ...nextState }
        renderComponent(this)
    }
}

export default Component

export function createComponent(component, props) {
    let instance

    // 若为 class 组件 直接 new 并返回实例
    if (component.prototype && component.prototype.render) {
        instance = new component(props)
    } else {
        // function 组件
        instance = new Component(props)
        instance.constructor = component
        // 这里注意不能使用 箭头函数 否则 this 指向会无法指定为 instance
        instance.render = function () {
            return this.constructor(props)
        }
    }

    return instance
}

export function renderComponent(component) {
    // 记录组件对应的 DOM
    let base

    const renderer = component.render()

    if (component.base && component.componentWillUpdate) {
        component.componentWillUpdate()
    }

    base = render(renderer)

    // 将注册的事件扔队列中 render 后调用
    if (component.base) {
        if (component.componentDidUpdate) _renderCallBacks.push(component.componentDidUpdate.bind(component))
    } else if (component.componentDidMount) {
        _renderCallBacks.push(component.componentDidMount.bind(component))
    }

    if (component.base && component.base.parentNode) {
        component.base.parentNode.replaceChild(base, component.base)
    }

    // component => base
    component.base = base
    // base => component
    base._component = component
}

export function setComponentProps(component, props) {
    // 判断是否第一次设置组件入参 调用钩子
    if (!component.base) {
        if (component.componentWillMount) {
            component.componentWillMount()
        }
    } else if (component.componentReceiveProps) {
        component.componentReceiveProps(props)
    }

    component.props = props

    renderComponent(component)
}
