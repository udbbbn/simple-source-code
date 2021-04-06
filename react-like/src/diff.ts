import { Fragment } from '.'
import { Vnode } from './../types/index.d'
import { componentUnmount, createComponent, renderComponent, setComponentProps } from './component'
import { removeDom, setAttribute } from './dom'
import { isSameNodeType, toString } from './util'

export function diff(dom, vnode: Vnode | String): HTMLElement {
    let result = dom

    if (typeof vnode === 'number') vnode = String(vnode)
    // 字符串节点
    if (typeof vnode === 'string') {
        // 若dom 跟 vnode 都是文字节点 直接替换文字
        if (dom?.nodeType === 3) {
            if (dom.textContent !== vnode) {
                dom.textContent = vnode
            }
        } else {
            // 否则新建文字节点 并替换 dom 节点
            result = document.createTextNode(vnode)

            if (dom?.parentNode) {
                dom.parentNode.replaceChild(result, dom)
            }
        }
        return result
    }

    // 比较组件
    if (typeof (vnode as Vnode).tag === 'function') {
        return diffComponent(dom, vnode as Vnode)
    }

    // 非文字节点
    // 若 dom 本身不存在 或 dom 跟 vnode 节点不一致 则表示新建节点
    // fragment时 vnode 为数组
    if (!dom || (toString(vnode) === '[object Object]' && dom.nodeName.toLowerCase() !== ((vnode as Vnode).tag as string).toLowerCase())) {
        result = document.createElement((vnode as Vnode).tag as string)

        if (dom) {
            // 将dom子元素移植到新节点下
            ;[...dom.children].forEach(child => result.appendChild(child))

            if (dom?.parentNode) {
                dom.parentNode.replaceChild(result, dom)
            }
        }
    }

    // 比较子节点
    // TODO：context 的 children 是一个 Vnode节点 需要像 组件一样处理
    // 需要注意的是 context 不可能从 div => context
    // context 只可能是更新 props
    if (toString((vnode as Vnode).children) === '[object Object]') {
        return result
            ? result.appendChild(diffComponent(dom, ((vnode as Vnode).children as unknown) as Vnode))
            : diffComponent(dom, ((vnode as Vnode).children as unknown) as Vnode)
    }

    if (((vnode as Vnode).children && (vnode as Vnode).children.length > 0) || (result.childNodes && result.childNodes.length > 0)) {
        diffChildren(result, (vnode as Vnode).children)
    }

    diffAttributes(result, vnode as Vnode)

    return result
}

function diffAttributes(dom, vnode: Vnode) {
    const old = {}
    const attrs = vnode.attrs

    // fragment 没有 attributes
    ;[...(dom.attributes || [])].forEach(attr => {
        old[attr.name] = attr.value
    })

    // 如果vnode上不存在 旧dom上的属性 则设置为 undefined
    for (let key in old) {
        if (!(old[key] in attrs)) {
            setAttribute(dom, key, undefined)
        }
    }

    for (let key in attrs) {
        setAttribute(dom, key, attrs[key])
    }
}

/**
 *
 * @param dom 根据虚拟dom生成的 dom对象 子节点为原dom子节点 因此比较的还是 旧dom节点
 * @param vChildren 虚拟dom的子节点
 */
function diffChildren(dom, vChildren) {
    const domChildren = dom.childNodes
    const children = []

    const keys = {}

    // 将有 key 的跟 没 key 的分开
    if (domChildren.length > 0) {
        domChildren.forEach(child => {
            const { key } = child
            if (key) {
                keys[key] = child
            } else {
                children.push(child)
            }
        })
    }

    // fragment 跟 context
    // vnode.children 都可能为非数组
    // 且在 createElement 中有处理 子元素若为一个不为数组
    if (toString(vChildren) !== '[object Array]' && vChildren) {
        vChildren = [(vChildren as unknown) as Vnode]
    }

    if (vChildren?.length) {
        let min = 0
        let max = children.length

        // 作用是将 fragment 的子节点展开 避免索引不正确
        // 能解决 索引不正确 问题
        // 但是会引发 给 fragmeent 设置 attrs 不生效问题
        vChildren = vChildren.reduce((t, c) => ([...t, (c.tag === Fragment ? c.children : c)]), []).flat()

        vChildren.forEach((vChild, idx) => {
            const { key } = vChild
            let domChild
            // 如果有 key 直接根据 key 去找相同 key 的dom元素
            if (key) {
                if (keys[key]) {
                    domChild = keys[key]
                    keys[key] = undefined
                }
            } else if (min < max) {
                // 如果没有 key 则优先比较同类型 元素
                for (let i = min; i < max; i++) {
                    const target = children[i]

                    if (target && isSameNodeType(target, vChild)) {
                        domChild = target
                        children[i] = undefined

                        // 缩小遍历范围
                        if (i === max - 1) max--
                        if (i === min) min++
                        break
                    }
                }
            }
            domChild = diff(domChild, vChild)
            // TODO： fragment 在 diff 中修改了实际dom长度 导致 根据索引来找相应的元素会错乱

            // 拿到旧 dom 同索引的元素
            const target = domChildren[idx]
            // 证明需要更新
            if (domChild && domChild !== dom && domChild !== target) {
                // 旧元素同索引下不存在 表明当前元素为新增
                if (!target) {
                    dom.appendChild(domChild)
                } else if (domChild === target.nextSibling) {
                    // 同索引下 新元素 全等于 旧dom同索引下的下一个元素 表示当前元素被移除
                    removeDom(target)
                } else {
                    // 否则直接插入元素
                    dom.insertBefore(domChild, target)
                }
            }
        })
    }
}

function diffComponent(dom, vnode: Vnode) {
    let c = dom?._component
    let oldDom = dom

    // 组件类型未变更 更新属性
    if (c?.constructor === vnode.tag) {
        setComponentProps(c, { ...vnode.attrs, children: vnode.children })

        dom = c.base
    } else {
        // 组件类型变更 替换组件
        if (c) {
            componentUnmount(c)
            oldDom = null
        }

        // 重新创建组件
        c = createComponent(vnode.tag, { ...vnode.attrs, children: vnode.children })

        setComponentProps(c, { ...vnode.attrs, children: vnode.children })

        dom = c.base

        // 旧dom为文字节点 vnode 为 组件
        if (oldDom && dom !== oldDom) {
            // 消除引用 移除实际 dom
            // 此处的引用应该是本来就不存在的 为了确保消除引用 一并加上
            oldDom._component = null
            removeDom(oldDom)
        }
    }

    return dom
}
