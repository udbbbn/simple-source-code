import React from "react"
import ReactDOM from "react-dom"
import useSWR from "./swr"

export default function Index() {
  const { data, error } = useSWR(
    "https://www.fastmock.site/mock/71052a7111740948d1e25fdd4bb5cd58/api/test"
  )

  console.log(data, error)

  if (error) return <div>Error</div>
  if (!data) return <div>Loading...</div>
  return <div>{JSON.stringify(data)}</div>
}

ReactDOM.render(<Index />, document.getElementById("app"))
