import { createStore, combineReducers, applyMiddleWare } from "../index"

const initMilkState = {
  milk: 0,
}
function milkReducer(state = initMilkState, action) {
  switch (action.type) {
    case "PUT_MILK":
      return { ...state, milk: state.milk + action.count }
    case "TAKE_MILK":
      return { ...state, milk: state.milk - action.count }
    default:
      return state
  }
}

const initRiceState = {
  rice: 0,
}
function riceReducer(state = initRiceState, action) {
  switch (action.type) {
    case "PUT_RICE":
      return { ...state, rice: state.rice + action.count }
    case "TAKE_RICE":
      return { ...state, rice: state.rice - action.count }
    default:
      return state
  }
}

function logger(store) {
  return function (next) {
    return function (action) {
      console.group(action.type)
      console.info("dispatching", action)
      let result = next(action)
      console.log("next state", store.getState())
      console.groupEnd()
      return result
    }
  }
}

// 使用combineReducers组合两个reducer
const reducer = combineReducers({ milkState: milkReducer, riceState: riceReducer })

let store = createStore(reducer, applyMiddleWare(logger))

store.subscribe(() => console.log(store.getState()))

store.dispatch({ type: "PUT_MILK", count: 1 }) // milk: 1
store.dispatch({ type: "PUT_MILK", count: 1 }) // milk: 2
store.dispatch({ type: "TAKE_MILK", count: 1 }) // milk: 1

store.dispatch({ type: "PUT_RICE", count: 1 }) // rice: 1
store.dispatch({ type: "PUT_RICE", count: 1 }) // rice: 2
store.dispatch({ type: "TAKE_RICE", count: 1 }) // rice: 1
