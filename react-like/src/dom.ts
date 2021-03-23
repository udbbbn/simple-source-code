import { Vnode } from '../types'
import { createComponent, executeRenderCallBack, setComponentProps } from './component'

export const ReactDom = {
    render: (vnode, container: HTMLElement) => {
        container.innerHTML = ''
        _render(vnode, container)
    }
}

const _render = function (vnode, container) {
    container.appendChild(render(vnode))
    // 执行清空队列
    executeRenderCallBack()
}

export function render(vnode: Vnode | string) {
    if (vnode === undefined || vnode === null || typeof vnode === 'boolean') vnode = ''

    if (typeof vnode === 'number') vnode = String(vnode)

    // 文字类型 创建返回文字节点
    if (typeof vnode === 'string') {
        const textNode = document.createTextNode(vnode)
        return textNode
    }

    if (typeof vnode.tag === 'function') {
        const component = createComponent(vnode.tag, vnode.attrs)

        setComponentProps(component, vnode.attrs)

        return component.base
    }

    let dom

    // fragment
    if (typeof vnode.tag === 'object' && (vnode.tag as DocumentFragment).nodeType === 11) {
        dom = vnode.tag
    } else {
        dom = document.createElement(vnode.tag)
    }

    if (vnode.attrs) {
        // 遍历设置属性
        Object.keys(vnode.attrs).forEach(key => {
            setAttribute(dom, key, (vnode as Vnode).attrs[key])
        })
    }

    vnode.children.forEach(child => _render(child, dom))

    return dom
}

function setAttribute(dom: HTMLElement, key, val: string) {
    // 将 className 转 class
    if (key === 'className') key = 'class'

    // 注册事件
    if (/on\w+/.test(key)) {
        const method = key.toLowerCase()
        dom[method] = val
    } else if (key === 'style') {
        // 文字型 style
        if (!val || typeof val === 'string') {
            dom.style.cssText = val || ''
        } else if (val && typeof val === 'object') {
            // 设置style 且数字自动补充 px 单位
            Object.entries(val).forEach(([styleKey, styleVal]) => {
                dom.style[styleKey] = typeof styleKey === 'number' ? styleVal + 'px' : styleVal
            })
        }
    } else {
        // 对象本来就有的属性直接赋值
        // 可能会疑问 为什么不统一用 setAttribute
        // 因为Dom的 attribute 跟 property 是有区别的
        // 且 setAttribute 参数皆为 string 反之则可以set数组或对象类型
        // .MD文件还有图片示意
        if (Reflect.has(dom, key)) {
            dom[key] = val || undefined
        }
        if (val) {
            dom.setAttribute(key, val)
        } else {
            dom.removeAttribute(key)
        }
    }
}
