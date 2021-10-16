/*
 * 本文内容直接 copy 于 https://juejin.cn/post/6925665796106485767
 * 原文地址: https://indepth.dev/posts/1007/the-how-and-why-on-reacts-usage-of-linked-list-in-fiber-to-walk-the-components-tree
 */

/* 节点 */
const a1 = { name: "a1" }
const b1 = { name: "b1" }
const b2 = { name: "b2" }
const b3 = { name: "b3" }
const c1 = { name: "c1" }
const c2 = { name: "c2" }
const d1 = { name: "d1" }
const d2 = { name: "d2" }
a1.render = () => {
  sleep(60)
  return [b1, b2, b3]
}
b1.render = () => {
  return []
}
b2.render = () => {
  sleep(20)
  return [c1]
}
b3.render = () => {
  sleep(20)
  return [c2]
}
c1.render = () => {
  sleep(40)
  return [d1, d2]
}
c2.render = () => []
d1.render = () => []
d2.render = () => []

/* 使用sleep模拟渲染的耗费时间 */
function sleep(ms = 100) {
  let sleepSwitch = true
  let s = Date.now()
  while (sleepSwitch) {
    if (Date.now() - s > ms) {
      sleepSwitch = false
    }
  }
}

class Node {
  constructor(instance) {
    this.instance = instance
    this.child = null
    this.sibling = null
    this.return = null
  }
}

function link(parent, elements) {
  if (elements === null) elements = []
  /**
   * 使用 reduceRight 从数组最后开始初始化节点
   * 最后一次遍历 将第一个字节点返回到 parent.child
   */
  parent.child = elements.reduceRight((previous, current) => {
    const node = new Node(current)
    node.return = parent
    node.sibling = previous
    return node
  }, null)
  return parent.child
}

const root = new Node(a1)
/* 一直保持对当前节点的引用 */
let current = root
/* 是否渲染完成 */
let isRendered = false

const rIcb = deadline => {
  if (deadline.timeRemaining() > 20) {
    walk(current, deadline)
  } else {
    requestIdleCallback(rIcb)
  }
}

function doWork(node, deadline) {
  if (deadline.timeRemaining() > 20) {
    console.log(node.instance.name)
    const children = node.instance.render()
    return link(node, children)
  } else {
    console.log(node.instance.name, "节点被抛到下一个空闲时间执行")
    requestIdleCallback(rIcb)
  }
}

function walk(o, deadline) {
  while (true) {
    let child = doWork(current, deadline)
    /**
     *  子节点若没有 child 此处 child 变量为 null
     *  若被抛到下一个空闲时间处理 则此处 child 变量为 undefined
     */
    if (child) {
      current = child
      continue
    }
    if (current === root) {
      return
    }
    if (child === undefined) {
      return
    }
    while (!current.sibling) {
      if (!current.return || current.return === root) {
        return
      }
      current = current.return
    }
    current = current.sibling
  }
}

/* safari 不支持 requestIdleCallback */
window.requestIdleCallback =
  window.requestIdleCallback ||
  function (handler) {
    let startTime = Date.now()

    return setTimeout(function () {
      handler({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50.0 - (Date.now() - startTime))
        },
      })
    }, 1)
  }

window.requestIdleCallback(rIcb)
