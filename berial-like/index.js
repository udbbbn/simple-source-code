const apps = [];

/* 此处做了 RAF 的兼容 但是在下一个 tag 版本中被删除 */
const defer =
  typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame
    : setTimeout;

export function define(tag, component, route) {
  /**
   * 原生自定义组件
   * https://developer.mozilla.org/zh-CN/docs/Web/API/Window/customElements
   */
  class Berial extends HTMLElement {
    constructor() {
      super();
      const template = document.createElement("template");
      template.innerHTML = `<!-- ${tag} -- ${route}  -->`;
      this.attachShadow({ mode: "open" }).appendChild(template.cloneNode(true));
    }
  }

  const hasDef = window.customElements.get(tag);
  if (!hasDef) {
    window.customElements.define(tag, Berial);
  }

  apps.push({
    tag,
    component,
    route,
  });

  return invoke();
}

function invoke() {
  /* 根据路由去加载组件 */
  const path = window.location.hash || window.location.pathname;

  apps.forEach((app) => {
    defer(() => {
      const host = document.querySelector(app.tag);
      if (app.route === path) {
        app.component.mount(host);
      } else {
        app.component.unmount(host);
      }
    });
  });
}

window.addEventListener("hashchange", invoke);
window.addEventListener("popstate", invoke);
