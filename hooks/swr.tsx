import { useState, useEffect, useCallback, useRef } from "react"

type options = {
  /** 是否聚焦时自动请求接口 */
  revalidateOnFocus: boolean
  /** 重新连接时重新请求 */
  revalidateOnReconnect: boolean
  /** 自动刷新时间 */
  refreshInterval: number
  /** 窗口不可见时进行轮询 */
  refreshWhenHidden: boolean
  /** 浏览器离线时轮询 */
  refreshWhenOffline: boolean
  /** fetch 有错误时重试 */
  shouldRetryOnError: boolean
  /** 错误重试的时间间隔 */
  errorRetryInterval: number
  /** 错误重试最大次数 ----------------- 官网说使用了 指数退避算法？ */
  errorRetryCount?: number
  /** 请求成功时的回调函数 */
  onSuccess?: (data, key, config) => void
  /** 请求失败时的回调函数 */
  onError?: (data, key, config) => void
}

export default function useSWR(
  api,
  fetcher = url => fetch(url).then(res => res.json()),
  options: options = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    refreshInterval: 0,
    shouldRetryOnError: true,
    errorRetryInterval: 5000,
  }
) {
  const {
    revalidateOnFocus,
    revalidateOnReconnect,
    refreshWhenHidden,
    refreshWhenOffline,
    refreshInterval,
    shouldRetryOnError,
    errorRetryInterval,
    onSuccess,
    onError,
  } = options

  const [state, setState] = useState({})
  const isFocus = useRef(false)
  const isOnline = useRef(false)

  const getData = useCallback(
    () =>
      fetcher(api)
        .then(res => {
          setState({
            data: res,
            error: null,
          })
          onSuccess?.(res, api, options)
        })
        .catch(err => {
          if (shouldRetryOnError) {
            setTimeout(() => {
              getData()
            }, errorRetryInterval)
          }
          setState({ data: null, error: err })
          onError?.(err, api, options)
        }),
    [api, onSuccess, onError, setState, shouldRetryOnError, errorRetryInterval]
  )

  useEffect(() => {
    api && getData()
  }, [api])

  //   const visibilitychange = useCallback(() => {
  //     if (document.hidden) {
  //       console.log("visibilitychange", "hidden")
  //       console.log("document.hidden", document.hidden)
  //       console.log("hasFocus", document.hasFocus())
  //     } else {
  //       console.log("visibilitychange", "show")
  //       console.log("document.hidden", document.hidden)
  //       console.log("hasFocus", document.hasFocus())
  //     }
  //   }, [])
  const focus = useCallback(() => {
    isFocus.current = true
    if (revalidateOnFocus) {
      getData()
    }
  }, [revalidateOnFocus])
  const blur = useCallback(() => {
    isFocus.current = false
  }, [])
  const onLine = useCallback(() => {
    isOnline.current = true
    if (revalidateOnReconnect) {
      getData()
    }
  }, [revalidateOnReconnect])
  const offLine = useCallback(() => {
    isOnline.current = false
  }, [])

  useEffect(() => {
    if (revalidateOnFocus) {
      //   document.addEventListener("visibilitychange", visibilitychange)
      window.addEventListener("focus", focus)
      window.addEventListener("blur", blur)
      return () => {
        // document.removeEventListener("visibilitychange", visibilitychange)
        window.removeEventListener("focus", focus)
        window.removeEventListener("blur", blur)
      }
    }
  }, [revalidateOnFocus])

  useEffect(() => {
    if (refreshInterval) {
      let timeInterval = setInterval(() => {
        if (refreshWhenHidden || refreshWhenOffline) {
          getData()
        } else if (isFocus.current) {
          getData()
        }
      }, refreshInterval)
      return () => clearInterval(timeInterval)
    }
  }, [isFocus.current, getData, refreshInterval, refreshWhenOffline, refreshWhenHidden])

  useEffect(() => {
    window.addEventListener("online", onLine)
    window.addEventListener("offline", offLine)
    return () => {
      window.removeEventListener("online", onLine)
      window.removeEventListener("offline", offLine)
    }
  }, [])

  const { data, error } = state

  return {
    data,
    error,
  }
}
