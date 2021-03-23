import { Vnode } from '../types'

function createElement(tag, attrs, ...children): Vnode {
    return {
        tag,
        attrs,
        children
    }
}

export const Fragment: any = document.createDocumentFragment()

export { createElement }
