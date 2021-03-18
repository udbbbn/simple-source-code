import { Vnode } from '../types'

function h(tag, attrs, ...children): Vnode {
    return {
        tag,
        attrs,
        children
    }
}

export { h }
