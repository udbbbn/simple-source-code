function request(url: string, options?: RequestInit) {
  return fetch(url, {
    mode: 'cors',
    ...options,
  })
}

export function fetchURL(url: string) {
  const fetchPromise = request(url)
  return fetchPromise.then((res) => {
    return res.text()
  })
}

export default request
