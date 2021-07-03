const fs = require("fs");
const path = require("path");
const babylon = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let Id = 0;

// 读取文件信息 获取依赖关系
function createAsset(fileName) {
  const content = fs.readFileSync(fileName, "utf-8");

  // 将文件内容转ast
  const ast = babylon.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];

  // 遍历ast 找到import语句 收集依赖
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      /*
    Node {
        type: 'ImportDeclaration',
        // ...
        source: Node {
            // ...
            value: './message.js'
        }
    */
      dependencies.push(node.source.value);
    },
  });

  const id = Id++;

  // es6 => es5
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: [["@babel/preset-env"]],
  });

  return {
    id,
    fileName,
    dependencies,
    code,
  };
}

// 分析依赖 形成依赖树 广度遍历
function createGraph(entry) {
  const mainAsset = createAsset(entry);

  // 从入口文件开始分析 在遍历子级时不断更新队列长度
  const queue = [mainAsset];

  for (const asset of queue) {
    // 获取目录
    // './example/entry.js' => './example'
    const dirname = path.dirname(asset.fileName);

    // 用于保存子依赖项的数据
    // 形如： { './message.js': 1 }
    // 1 为 message 的 模块 id
    asset.mapping = {};

    asset.dependencies.forEach((childPath) => {
      // path.join(dirname, childPath)
      const child = createAsset(path.join(dirname, childPath));

      asset.mapping[childPath] = child.id;

      // 将子级push进队列 广度遍历
      queue.push(child);
    });
  }

  return queue;
}

// 生成浏览器可执行文件
function bundle(graph) {
  let modules = "";

  graph.forEach((module) => {
    modules += `${module.id}: [
            function (require, module, exports) { ${module.code} },
            ${JSON.stringify(module.mapping)}
        ],`;
  });

  // require, module, exports 是cjs的标准 现代浏览器不支持 故此处模拟
  const result = `
        (function (modules) {
            function require(id) {
                const [fn, mapping] = modules[id];
                function localRequire(childPath) {
                    return require(mapping[childPath])
                }
                const module = { exports: {} };
                // 执行每个模块的代码
                fn(localRequire, module, module.exports);
                return module.exports
            }
            //执行入口文件，
            require(0);
        })({${modules}})
    `;

  return result;
}

const graph = createGraph("./example/entry.js");
const result = bundle(graph);

// 打包生成文件
fs.writeFileSync("./bundle.js", result);
