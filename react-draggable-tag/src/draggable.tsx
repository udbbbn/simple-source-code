import { CSSProperties } from "react"
import { useEffect, useRef, useState } from "react"
import "./index.scss"

type Id = number | string
type Tag = {
  id: Id
  content: string
  unDraggable?: boolean
  [otherProps: string]: any
}
type Position = {
  id: Id
  left: number
  top: number
  bottom: number
  right: number
  width: number
  height: number
}[]

type RenderParams = {
  tag: Tag
  index: number
}
type DomCtx = {
  draggbleWrapper: HTMLDivElement
  tagEles: { [key: Id]: HTMLDivElement }
  tagPositions: Position
  draggbleTagEles: { [key: Id]: HTMLDivElement }
}

interface Props {
  tags?: Tag[]
  initialTags?: Tag[]
  className?: string
  tagStyle?: CSSProperties
  render: (params: RenderParams) => JSX.Element
  onChange: (tag: JSX.Element) => void
}

export default function Draggable(props: Props) {
  const { initialTags, className, tagStyle = {}, tags: propTags, render: propRender } = props
  const [tags, setTags] = useState<Tag[]>([])
  const domCtx = useRef<DomCtx>({
    draggbleWrapper: null,
    tagEles: {},
    tagPositions: [],
    draggbleTagEles: {},
  })
  const dragInfo = useRef({
    isMove: false,
  })

  useEffect(() => {
    if (initialTags && initialTags.length) {
      console.log("2")
      setTags(initialTags)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (propTags.length !== tags.length || propTags.some((el, i) => el.id !== tags[i].id)) {
      setTags(propTags)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propTags])

  useEffect(() => {
    domCtx.current.tagPositions = []
    tags.forEach(t => {
      const { draggbleTagEles, tagEles, tagPositions } = domCtx.current
      const tagEle = tagEles[t.id]
      const dragTagEle = draggbleTagEles[t.id]
      tagPositions.push({
        id: t.id,
        left: tagEle.offsetLeft,
        top: tagEle.offsetTop,
        bottom: tagEle.offsetTop + tagEle.offsetHeight,
        right: tagEle.offsetLeft + tagEle.offsetWidth,
        width: tagEle.offsetWidth,
        height: tagEle.offsetHeight,
      })
      if (!t.unDraggable) {
        onDragElement(dragTagEle, t.id, tagEle)
      }
    })
    console.log("result", domCtx.current)
  }, [tags])

  function onDragElement(ele: HTMLDivElement, id, parent) {
    let prevX = 0,
      prevY = 0

    const onDragStart = (e: MouseEvent) => {
      e = e || (window.event as MouseEvent)
      prevX = e.clientX
      prevY = e.clientY
      if (dragInfo.current.isMove) return
      dragInfo.current.isMove = true
      ele.style.zIndex = "2"
      document.addEventListener("mousemove", onDragMove)
      document.addEventListener("mouseup", onDragEnd)
    }
    const onDragMove = (e: MouseEvent) => {
      const { tagPositions } = domCtx.current
      e = e || (window.event as MouseEvent)
      if (dragInfo.current.isMove) {
        const position = tagPositions.find(el => el.id === id)
        const movedX = e.clientX - prevX + ele.offsetLeft
        const movedY = e.clientY - prevY + ele.offsetTop
        prevX = e.clientX
        prevY = e.clientY
        ele.style.left = `${movedX}px`
        ele.style.top = `${movedY}px`
      }
    }
    const onDragEnd = () => {
      dragInfo.current.isMove = false
      ele.style.zIndex = "1"
      document.removeEventListener("mousemove", onDragMove)
      document.removeEventListener("mouseup", onDragEnd)
    }

    ele.addEventListener("mousedown", onDragStart)
  }

  return (
    <div
      className={`DraggbleWrapper ${className || ""}`}
      ref={v => (domCtx.current.draggbleWrapper = v)}
    >
      {tags.map((tag, i) => (
        <div
          key={tag.id}
          className={"DraggbleWrapper-tag"}
          style={tagStyle}
          ref={v => (domCtx.current.tagEles[tag.id] = v)}
        >
          <div
            className={"DraggbleWrapper-tag-drag"}
            ref={v => (domCtx.current.draggbleTagEles[tag.id] = v)}
          >
            {propRender({ tag, index: i })}
          </div>
          <div
            style={{
              opacity: 0,
              overflow: "hidden",
            }}
          >
            {propRender({ tag, index: i })}
          </div>
        </div>
      ))}
    </div>
  )
}
