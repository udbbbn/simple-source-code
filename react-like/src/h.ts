import { Vnode } from '../types'

function createElement(tag, attrs, children): Vnode {
    if (arguments.length > 3) {
        children = [children]
        for (let i = 3; i < arguments.length; i++) {
            children.push(arguments[i])
        }
    }

    return {
        tag,
        attrs,
        children
    }
}

function _Fragment(props) {
    return props.children
}

export function Fragment({children = [], ...attrs}): Vnode {
    return {
        tag: _Fragment,
        attrs,
        children
    }
}

export { createElement }
