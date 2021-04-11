import { ComponentLifeCycle, Vnode } from './../types/index.d'
import { diff } from './diff'
import { render, removeDom } from './dom'
import { enqueueSetState } from './setState'
import { toString } from './util'

// Map<symbol, Function)>[]
const _renderCallBacks = []

// render 后的回调
export const executeRenderCallBack = componentId => {
    const callBacks = _renderCallBacks.map(el => el.get(componentId)).filter(Boolean)
    while (callBacks.length) {
        const callBack = callBacks.shift()
        callBack()
    }
}

class Component<P = {}, S = {}> implements React.Component<P, S> {
    __component_id__: symbol
    state: S
    props: P
    __prevState: any

    constructor(props = {}) {
        this.__component_id__ = Symbol()
        this.__prevState = null
        this.state = {} as S
        this.props = props as P
    }

    setState(stateChange) {
        enqueueSetState(stateChange, this)
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
        // TODO：通过 diff 算法，context 组件不会重新生成 只会更新 props 值
        // 故 应该优先 instance 组件内部的 props
        instance.render = function () {
            return this.constructor(this.props || props)
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

    // 如果是 fragment renderer 结果会为多个
    if (toString(renderer) === '[object Array]') {
        const fragment = document.createDocumentFragment()
        // 为了解决 fragment 多子节点造成 diff 索引找不到正确的 dom 元素
        // 方案：diff children 时将 fragment 子节点展开
        renderer.forEach(el => {
            fragment.appendChild(render(el))
        })
        base = diff(fragment, renderer)
    } else {
        base = diff(component.base, renderer)
    }


    // 将注册的事件扔队列中 render 后调用
    if (component.base) {
        if (component.componentDidUpdate) _renderCallBacks.push(new Map([[component.__component_id__, component.componentDidUpdate.bind(component)]]))
    } else if (component.componentDidMount) {
        _renderCallBacks.push(new Map([[component.__component_id__, component.componentDidMount.bind(component)]]))
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

export function componentUnmount(component: React.Component) {
    component?.componentWillUnmount?.()
    removeDom(component.base)
}
