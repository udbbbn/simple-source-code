export const toString = context => Object.prototype.toString.call(context)

export function isSameNodeType(dom, vnode) {
    // 普通字符串
    if (typeof vnode === 'string' || typeof vnode === 'number') return dom.nodeType === 3
    // div span ...
    if (typeof vnode.tag === 'string') return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase()

    return dom?._component?.constructor === vnode.tag
}

export const defer = fn => Promise.resolve().then(fn)