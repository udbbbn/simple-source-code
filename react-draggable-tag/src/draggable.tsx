import { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import "./index.scss";

type Id = number | string;
type Tag = {
  id: Id;
  content: string;
  unDraggable?: boolean;
  [otherProps: string]: any;
};
type Position = {
  id: Id;
  left: number;
  top: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}[];

type RenderParams = {
  tag: Tag;
  index: number;
};
type DomCtx = {
  draggbleWrapper: HTMLDivElement;
  tagEles: { [key: Id]: HTMLDivElement };
  tagPositions: Position;
  draggbleTagEles: { [key: Id]: HTMLDivElement };
};

interface Props {
  tags?: Tag[];
  initialTags?: Tag[];
  className?: string;
  tagStyle?: CSSProperties;
  render: (params: RenderParams) => JSX.Element;
  onChange: (tag: JSX.Element) => void;
}

export default function Draggable(props: Props) {
  const {
    initialTags,
    className,
    tagStyle = {},
    tags: propTags,
    render: propRender,
  } = props;
  const [tags, setTags] = useState<Tag[]>([]);
  const domCtx = useRef<DomCtx>({
    draggbleWrapper: null,
    tagEles: {},
    tagPositions: [],
    draggbleTagEles: {},
  });

  useEffect(() => {
    if (initialTags && initialTags.length) {
      setTags(initialTags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      propTags.length !== tags.length ||
      propTags.some((el, i) => el.id !== tags[i].id)
    ) {
      setTags(propTags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propTags]);

  useEffect(() => {
    domCtx.current.tagPositions = [];
    tags.forEach((t) => {
      const { draggbleTagEles, tagEles, tagPositions } = domCtx.current;
      const domTarget = draggbleTagEles[t.id];
      const tag = tagEles[t.id];
      tagPositions.push({
        id: t.id,
        left: tag.offsetLeft,
        top: tag.offsetTop,
        bottom: tag.offsetTop + tag.offsetHeight,
        right: tag.offsetLeft + tag.offsetWidth,
        width: tag.offsetWidth,
        height: tag.offsetHeight,
      });
      if (!t.unDraggable) {
        dragElement(tag, t.id, domTarget);
      }
    });
    console.log("result", domCtx.current);
  }, [tags]);

  function dragElement(ele, id, parent) {}

  return (
    <div
      className={`DraggbleWrapper ${className || ""}`}
      ref={(v) => (domCtx.current.draggbleWrapper = v)}
    >
      {tags.map((tag, i) => (
        <div
          key={tag.id}
          className={"DraggbleWrapper-tag"}
          style={tagStyle}
          ref={(v) => (domCtx.current.tagEles[tag.id] = v)}
        >
          <div
            className={"DraggbleWrapper-tag-drag"}
            ref={(v) => (domCtx.current.draggbleTagEles[tag.id] = v)}
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
  );
}
