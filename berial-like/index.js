const apps = [];

export function define(view, route) {
  /**
   * 原生自定义组件
   * https://developer.mozilla.org/zh-CN/docs/Web/API/Window/customElements
   */
  class Berial extends HTMLElement {
    constructor() {
      super();
      const template = document.createElement("template");
      template.innerHTML = "<div></div>";
      this.attachShadow({ mode: "open" }).appendChild(template.cloneNode(true));
    }
  }

  const hasDef = window.customElements.get("berial-app");
  if (!hasDef) {
    window.customElements.define("berial-app", Berial);
  }

  apps.push({
    view,
    route,
    Berial,
  });

  return invoke();
}

function invoke() {
  /* 根据路由去加载组件 */
  const path = window.location.hash || window.location.pathname;

  const comps = apps.filter((item) => item.route === path).map(shouldLoad);

  return Promise.all(comps)
    .then(() => apps)
    .catch((err) => console.log(err));
}

function shouldLoad(app) {
  const p = app.view({});
  return p
    .then((module) => queueJob(module.render, app.Berial))
    .catch((err) => app);
}

function queueJob(queue, Berial) {
  queue.forEach((render) => {
    render(document.querySelector("berial-app").shadowRoot);
  });
}

window.addEventListener("hashchange", invoke);
window.addEventListener("popstate", invoke);
