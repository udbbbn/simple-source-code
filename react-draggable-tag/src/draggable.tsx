import { useEffect, useState } from "react";

type Id = number | string | Symbol;
type Tag = { id: Id; content: string };
type renderParams = {
  tag: Tag;
  index: number;
};

interface Props {
  tags?: Tag[];
  initialTags?: Tag[];
  render: (renderParams) => JSX.Element;
  onChange: (tag: JSX.Element) => void;
}

export default function Draggable(props: Props) {
  const { initialTags } = props;
  const [tag, setTag] = useState([]);

  useEffect(() => {}, [initialTags]);

  return <div></div>;
}
