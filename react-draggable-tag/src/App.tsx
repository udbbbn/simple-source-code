import Draggable from "./draggable";

const initialTags = [
  { id: 1, content: "apple" },
  { id: 2, content: "olive" },
  { id: 3, content: "banana" },
  { id: 4, content: "lemon" },
  { id: 5, content: "orange" },
  { id: 6, content: "grape" },
  { id: 7, content: "strawberry" },
  { id: 8, content: "cherry" },
  { id: 9, content: "peach" },
];

function App() {
  return (
    <div
      className="App"
      style={{
        border: "1px solid #eee",
      }}
    >
      <Draggable
        tags={initialTags}
        render={({ tag, index }) => (
          <div
            style={{
              border: "1px solid #eee",
              marginTop: 10,
              marginRight: 10,
              color: "#000",
            }}
          >
            {tag.content}
          </div>
        )}
        onChange={(tags) => console.log(tags)}
      ></Draggable>
    </div>
  );
}

export default App;
