const acorn = require("acorn");
const { SourceMapGenerator } = require("source-map");

/**
 * 实现 parser
 * acorn 作用是 将源码解析成 ast
 * 扩展 acorn 的 方式为 继承+重写
 */
const Parser = acorn.Parser;
const literalExtend = (Parser) =>
  class extends Parser {
    parseLiteral(...args) {
      const node = super.parseLiteral(...args);
      /**
       * 只使用 acorn 转 ast 会发现
       * 不管是 number 还是 string 的type 都会是 'Literal'
       * 无法判断具体是什么字面量
       * 而 通过类型值的类型来判断类型 改写 type 就能一眼看出类型了
       * 这部分内容可以通过 https://astexplorer.net/ 来测试查看
       * 注意设置 transform => babel 7
       */
      switch (typeof node.value) {
        case "number":
          node.type = "NumericLiteral";
          break;
        case "string":
          node.type = "StringLiteral";
          break;
      }

      return node;
    }
  };

const newParser = Parser.extend(literalExtend);

/**
 * traverse
 * 遍历 ast 调用 visitor 处理 ast 节点
 *
 * 设置每种 ast 该如何遍历数据
 * Program VariableDeclaration 等类型也可以通过 https://astexplorer.net/ 查看
 */
const AST_DEFINATIONS_MAP = new Map();
AST_DEFINATIONS_MAP.set("Program", {
  visitor: ["body"],
});
AST_DEFINATIONS_MAP.set("VariableDeclaration", {
  visitor: ["declarations"],
});
AST_DEFINATIONS_MAP.set("VariableDeclarator", {
  visitor: ["id", "init"],
});
AST_DEFINATIONS_MAP.set("Identifier", {});
AST_DEFINATIONS_MAP.set("NumericLiteral", {});

/**
 * 新增一个 NodePath 类 记录 traverse 中的父节点信息
 * 因为遍历 ast 节点并不会体现父节点关系
 *
 * {
 *    node: ast 节点,
 *    parent: ast 父节点,
 *    parentPath: 父节点的 NodePath,
 *    key: ast 中属性 key 即 AST_DEFINATIONS_MAP 中设置的,
 *    listIdx: 若 key 对应的值为数组 记录数组索引以便找到相应元素
 */
class NodePath {
  constructor(node, parent, parentPath, key, listIdx) {
    this.node = node;
    this.parent = parent;
    this.parentPath = parentPath;
    this.key = key;
    this.listIdx = listIdx;
  }

  replaceWith(node) {
    if (this.listIdx) {
      this.parent[this.key].splice(this.listIdx, 1, node);
    } else {
      this.parent[this.key] = node;
    }
  }

  remove() {
    if (this.listIdx) {
      this.parent[this.key].splice(this.listIdx, 1);
    } else {
      this.parent[this.key] = null;
    }
  }
}

/**
 * 遍历规则为 深度优先遍历
 * (1) 支持 visitor
 * (2) 支持 enter exit 选择在遍历子节点之前以及之后调用 若直接传入函数 则当作 enter
 */
function traverse(node, visitors, parent, parentPath, key, listIdx) {
  const defination = AST_DEFINATIONS_MAP.get(node.type);

  let visitorFunc = visitors[node.type] || {};

  if (typeof visitorFunc === "function") {
    visitorFunc = {
      enter: visitorFunc,
    };
  }

  const path = new NodePath(node, parent, parentPath, key, listIdx);

  visitorFunc.enter && visitorFunc.enter(path);

  if (defination?.visitor) {
    defination.visitor.forEach((key) => {
      const prop = node[key];
      // 可能为数组 可能为对象
      if (Array.isArray(prop)) {
        prop.forEach((childNode, idx) => {
          traverse(childNode, visitors, node, path, key, idx);
        });
      } else {
        traverse(prop, visitors, node, path, key);
      }
    });
  }

  visitorFunc.exit && visitorFunc.exit(path);
}

// 定义 template 来通过字符串创建 ast
function template(code) {
  return newParser.parse(code);
}

template.expression = function (code) {
  // 形如：
  // {
  //   "type": "Program",
  //   "start": 0,
  //   "end": 3,
  //   "body": [
  //     {
  //       "type": "ExpressionStatement",
  //       "start": 0,
  //       "end": 3,
  //       "expression": {
  //         "type": "Identifier",
  //         "start": 0,
  //         "end": 3,
  //         "name": "bbb"
  //       }
  //     }
  //   ],
  //   "sourceType": "script"
  // }
  return template(code).body[0].expression;
};

/**
 * generate
 * 将 ast 打印成目标代码
 *
 * 可前往 astexplorer 自行对应查看
 */
class Printer {
  constructor() {
    this.buf = "";
  }

  space() {
    this.buf += " ";
  }

  nextLine() {
    this.buf += "\n";
  }

  // ast根目录
  Program(node) {
    node.body.forEach((item) => {
      this[item.type](item) + ";";
      this.nextLine();
    });
  }

  // 变量声明
  VariableDeclaration(node) {
    this.buf += node.kind;
    this.space();
    // 根据 ast 解析结果分析 每条语句是一个 declaration
    // 即 const a = 1; 为 一个 declaration
    node.declarations.forEach((declaration, idx) => {
      if (idx != 0) {
        // const a = 1, b = 2; 也是一个 declaration
        this.buf += ",";
      }
      this[declaration.type](declaration);
    });
    this.buf += ";";
  }

  // 变量声明具体描述
  VariableDeclarator(node) {
    // 此处 node.id 是个 object
    this[node.id.type](node.id);
    this.buf += "=";
    this[node.init.type](node.init);
  }

  Identifier(node) {
    this.buf += node.name;
  }

  NumericLiteral(node) {
    this.buf += node.value;
  }

  StringLiteral(node) {
    this.buf += node.value;
  }
}

class Generator extends Printer {
  generate(node) {
    this[node.type](node);
    return this.buf;
  }
}

function generate(node) {
  return new Generator().generate(node);
}

/**
 * @babel/core 全流程包
 * 支持 plugin 和 preset
 */
function transformSync(code, options) {
  const ast = newParser.parse(code);

  const pluginApi = { template };

  const visitors = {};
  options.plugins.forEach(([plugin, options]) => {
    const res = plugin(pluginApi, options);
    Object.assign(visitors, res.visitor);
  });
  traverse(ast, visitors);
  return generate(ast);
}

const sourceCode = `
const a = 1;
`;

const code = transformSync(sourceCode, {
  plugins: [
    [
      function plugin1(api, options) {
        return {
          visitor: {
            Identifier(path) {
              // path.node.value = 2222;
              path.replaceWith(api.template.expression(options.replaceName));
            },
          },
        };
      },
      {
        replaceName: "ddddd",
      },
    ],
  ],
});
console.log(code);

// 调用 source-map 包实现 sourcemap
// 思路：ast 中的源位置信息 + 打印目标代码时 计算新的行列号
const map = new SourceMapGenerator({
  file: "source-mapped.js",
});

map.addMapping({
  generated: {
    line: 10,
    column: 35,
  },
  source: "foo.js",
  original: {
    line: 33,
    column: 2,
  },
  name: "christopher",
});

// console.log(map.toString());

// 本文学习于 https://juejin.cn/post/6962861837800964133
// 期待作者小册发布！
