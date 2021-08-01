function createStore(reducer, enhancer) {
  if (enhancer && typeof enhancer === "function") {
    const newCreateStore = enhancer(createStore)
    const newStore = newCreateStore(reducer)
    return newStore
  }

  let state
  const listeners = []

  function subscribe(callback) {
    listeners.push(callback)
  }

  function dispatch(action) {
    state = reducer(state, action)

    listeners.forEach(item => {
      item()
    })
  }

  const getState = () => state

  return {
    subscribe,
    dispatch,
    getState,
  }
}

function combineReducers(reducers) {
  const keys = Object.keys(reducers)

  const reducer = (state = {}, action) => {
    const newState = {}
    keys.forEach(key => {
      newState[key] = reducers[key](state[key], action)
    })

    return newState
  }

  return reducer
}

function applyMiddleWare(middleware) {
  return function enhancer(createStore) {
    return function newCreateStore(reducer) {
      const store = createStore(reducer)

      const func = middleware(store)

      const { dispatch } = store

      const newDispatch = func(dispatch)

      return { ...store, dispatch: newDispatch }
    }
  }
}

export { createStore, combineReducers, applyMiddleWare }
