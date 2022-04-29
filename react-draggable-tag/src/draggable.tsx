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
  const tagInitial = useRef(true)
  /* record tag after moving event callback */
  const calculateCallback = useRef(null)
  /* record tag old event */
  const eventsMap = useRef<{
    [id: Id]: {
      mouseUpArray: ((e) => void)[]
      mouseMoveArray: ((e) => void)[]
    }
  }>({})
  const domCtx = useRef<DomCtx>({
    draggbleWrapper: null,
    tagEles: {},
    tagPositions: [],
    draggbleTagEles: {},
  })

  useEffect(() => {
    if (initialTags && initialTags.length) {
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
    const { draggbleTagEles, tagEles, tagPositions } = domCtx.current
    tags.forEach(t => {
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
      /* 初始化才注册事件 */
      if (!t.unDraggable) {
        onDragElement(dragTagEle, t.id, tagEle)
      }
    })
    if (tagInitial.current) {
      tagInitial.current = false
    }

    if (calculateCallback.current) {
      calculateCallback.current(tags, tagEles)
      calculateCallback.current = null
    }
  }, [tags])

  function removeMoveEvent(id) {
    if (!eventsMap.current[id]) {
      eventsMap.current[id] = {
        mouseMoveArray: [],
        mouseUpArray: [],
      }
    }
    const { mouseMoveArray, mouseUpArray } = eventsMap.current[id]
    mouseMoveArray.forEach((event, i) => {
      document.removeEventListener("mousemove", event)
      mouseMoveArray[i] = null
    })
    mouseUpArray.forEach((event, i) => {
      document.removeEventListener("mouseup", event)
      mouseUpArray[i] = null
    })
    eventsMap.current[id].mouseMoveArray = eventsMap.current[id].mouseMoveArray.filter(Boolean)
    eventsMap.current[id].mouseUpArray = eventsMap.current[id].mouseUpArray.filter(Boolean)
  }

  function onDragElement(ele: HTMLDivElement, id, parent: HTMLDivElement) {
    let prevX = 0,
      prevY = 0
    let index = 0

    const onDragStart = (e: MouseEvent) => {
      e = e || (window.event as MouseEvent)
      prevX = e.clientX
      prevY = e.clientY
      ele.style.zIndex = "2"
      if (!eventsMap.current[id]) {
        eventsMap.current[id] = {
          mouseMoveArray: [],
          mouseUpArray: [],
        }
      }
      removeMoveEvent(id)
      eventsMap.current[id].mouseMoveArray.push(onDragMove)
      eventsMap.current[id].mouseUpArray.push(ondragend)
      document.addEventListener("mousemove", onDragMove)
      document.addEventListener("mouseup", onDragEnd)

      // const { tagPositions } = domCtx.current
      index = domCtx.current.tagPositions.findIndex(el => el.id === id)
    }
    const onDragMove = (e: MouseEvent) => {
      /**
       * 需要注意的是 ele 的位移是基于 parent 的.
       * Dom 结构中 parent 为 relative. ele 为 absolute.
       */
      const { tagPositions, tagEles } = domCtx.current
      e = e || (window.event as MouseEvent)
      const movedX = e.clientX - prevX
      const movedY = e.clientY - prevY
      prevX = e.clientX
      prevY = e.clientY
      const l = movedX + ele.offsetLeft
      console.log("- move l", l)
      const t = movedY + ele.offsetTop
      ele.style.left = `${l}px`
      ele.style.top = `${t}px`
      /* tag拖动前的中心坐标 */
      const baseCenterTop = parent.offsetTop + ele.offsetHeight / 2
      const baseCenterLeft = parent.offsetLeft + ele.offsetWidth / 2
      /* tag 当前的坐标 */
      const curTop = baseCenterTop + t
      const curLeft = baseCenterLeft + l

      // const position = tagPositions[index]
      for (let i = 0; i < domCtx.current.tagPositions.length - 1; i++) {
        if (index !== i) {
          const p1 = domCtx.current.tagPositions[i]
          const p2 = domCtx.current.tagPositions[i + 1]
          // console.log(p1.right, curLeft, p2.left)
          if (p1.right - 8 < curLeft && curLeft <= p2.left + 8) {
            console.log("compare result", i)

            const curTag = tags.splice(index, 1)
            if (i > index) {
              tags.splice(i, 0, ...curTag)
              index = i
            } else {
              tags.splice(i + 1, 0, ...curTag)
              index = i + 1
            }

            calculateCallback.current = (({ index, baseLeft, prevBaseLeft, prevBaseTop }) =>
              function (tags: Tag[], tagEles) {
                let curBaseTop, curBaseLeft
                tags.some((el, i) => {
                  if (i === index) {
                    const tag = tagEles[id]
                    curBaseLeft = tag.offsetLeft
                    curBaseTop = tag.offsetTop
                    return true
                  }
                  return false
                })

                if (prevBaseLeft < curBaseLeft) {
                  ele.style.left = `${baseLeft - curBaseLeft + prevBaseLeft}px`
                } else {
                  ele.style.left = `${baseLeft + prevBaseLeft - curBaseLeft}px`
                }
              })({
              index,
              baseLeft: l,
              prevBaseLeft: domCtx.current.tagEles[id].offsetLeft,
              prevBaseTop: domCtx.current.tagEles[id].offsetTop,
            })

            setTags([...tags])

            // console.log("-", position)
            // if (i > index) {
            //   //   console.log("-", l, tagPositions[i].left, position.left)
            //   ele.style.left = `${l - tagPositions[i].width}px`
            // } else {
            //   //   // console.log("+", l, tagPositions[translateIdx].left, position.left)
            //   //   // ele.style.left = `${l + position.left - tagPositions[translateIdx].left}px`
            // }
            break
          }
        }
      }
    }
    const onDragEnd = () => {
      ele.style.zIndex = "1"
      ele.style.left = `0`
      ele.style.top = `0`
      removeMoveEvent(id)
    }

    ele.removeEventListener("mousedown", onDragStart)

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
