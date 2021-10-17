/**
 * 原文查看 https://react.iamkasong.com/hooks/create.html#update数据结构
 * */
let workInProgressHook
let isMount = true

const fiber = {
  memoizedState: null,
  stateNode: App,
}

function App() {
  const [num, updateNum] = useState()
  console.log(`${isMount ? "mount" : "update"} num: `, num)

  return {
    click() {
      updateNum(num => (num ? num : 0) + 1)
    },
  }
}

window["app"] = schedule()

function useState(initialValue = undefined) {
  let hook

  if (isMount) {
    hook = {
      queue: {
        pending: null,
      },
      memoizedState: initialValue,
      next: null,
    }
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook
    } else {
      workInProgressHook.next = hook
    }
    workInProgressHook = hook
  } else {
    hook = workInProgressHook
    workInProgressHook = workInProgressHook.next
  }

  let baseState = hook.memoizedState
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next

    do {
      const action = firstUpdate.action
      baseState = action(baseState)
      firstUpdate = firstUpdate.next
    } while (firstUpdate !== hook.queue.pending)

    hook.queue.pending = null
  }
  hook.memoizedState = baseState

  return [baseState, dispatchAction.bind(null, hook.queue)]
}

function dispatchAction(queue, action) {
  const update = {
    action,
    next: null,
  }

  /**
   * 这里要注意 这样的处理是把  hook.queue 的值始终保持为 lastUpdate
   * 然后 lastUpdate.next 始终为 firstUpdate
   */
  if (queue.pending === null) {
    update.next = update
  } else {
    update.next = queue.pending.next
    queue.pending.next = update
  }
  queue.pending = update

  schedule()
}

function schedule() {
  workInProgressHook = fiber.memoizedState
  const app = fiber.stateNode()
  isMount = false
  return app
}

/**
 * 更新流程：每次执行 setState 会将 update 挂在到 hook.queue.pending 上
 * 更新完后就会把 hook.queue.pending = null
 */
