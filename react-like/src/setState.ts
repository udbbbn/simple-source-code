import Component, { renderComponent } from "./component";
import { defer } from "./util";

type StateChangeCallBack = (prevState, prevProps) => Record<string, any>;
type StateChange = Record<string, any> | StateChangeCallBack;

const queue: { stateChange: StateChange; component: Component }[] = [];
const componentQueue: Component[] = [];

export function enqueueSetState(stateChange, component) {
  // 在第一条 setState 的时候就抛进任务队列中 同步代码执行完成后就更新
  // 这样的做法是 state 跟 render 同时异步处理
  // preact 做法是将 state 跟 render 分开
  // 即 setState 时 state 同步 render 异步
  // TODO: 后续可以实现一个 preact 版本

  // 后续再次思考异步 setstate 发现一个问题 假如 state 同步更新
  // 那 props 要等待组件 render 后才能 拿到正确的值
  // 那么 state 跟 props 就会不同步
  if (queue.length === 0) {
    defer(flush);
  }
  queue.push({
    stateChange,
    component,
  });
  // 组件队列 保证唯一
  if (componentQueue.some((comp) => comp !== component)) {
    componentQueue.push(component);
  }
}

// 清空 setstate 队列
function flush() {
  queue.forEach((item) => {
    const { stateChange, component } = item;
    if (!component.__prevState) {
      component.__prevState = { ...component.state };
    }

    if (typeof stateChange === "function") {
      component.state = {
        ...component.state,
        ...stateChange(component.__prevState, component.props),
      };
    } else {
      component.state = { ...component.state, ...stateChange };
    }

    component.__prevState = component.state;
  });

  componentQueue.forEach((comp) => {
    renderComponent(comp);
  });
}
