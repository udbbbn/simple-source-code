import ProxySandbox from './proxySandbox'

function createSandboxWithLifeCycle(global?: Window) {
  const sandbox = new ProxySandbox(global ?? window)

  /* 这里注意使用了 async 返回了一个Promise*/
  const mount = async () => {
    sandbox.activate()
  }

  const unmount = async () => {
    sandbox.deactivate()
  }

  return {
    sandbox,
    mount,
    unmount,
  }
}

export default createSandboxWithLifeCycle()
