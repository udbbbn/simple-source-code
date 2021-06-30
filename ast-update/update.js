const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;
const prettier = require("prettier");
// import { default as prettier } from "prettier-format";

const module2PropKey = {};

function readFile(filePath, callBack) {
  fs.readdir(filePath, (err, files) => {
    let fileNum = files.length;
    if (!fileNum) {
      callBack();
    }
    files.forEach((fileName) => {
      const fileDir = path.join(filePath, fileName);
      fs.stat(fileDir, (err, stats) => {
        const isFile = stats.isFile();
        const isDir = stats.isDirectory();
        if (isFile) {
          fs.readFile(fileDir, "utf8", (err, data) => {
            fileName === "item.tsx" && getModulePropKey(data, fileDir);
            fileNum -= 1;
            if (!fileNum) {
              callBack();
            }
          });
        } else if (isDir) {
          readFile(fileDir, () => {
            fileNum -= 1;
            if (!fileNum) {
              callBack();
            }
          });
        }
      });
    });
  });
}

function getModulePropKey(code, filePath) {
  const fileAST = parser.parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "classProperties", "decorators-legacy"],
  });

  /**
   * // ...
   * this.changeOpen(false);
   * // ...
   *
   * To
   *
   * // ...
   * if (this.state.id) {
   *   this.getDetail(this.state.id, this.state.readOnly);
   * } else {
   *   this.changeOpen(false);
   * }
   * // ...
   */
  traverse(fileAST, {
    ClassProperty: function (path) {
      if (
        path.node.key.name === "actionDone" &&
        path.node.value.body.body[2]?.expression?.callee?.property?.name ===
          "changeOpen"
      ) {
        path.node.value.body.body[2] = t.ifStatement(
          t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier("state")),
            t.identifier("id")
          ),
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.thisExpression(),
                  t.identifier("getDetail")
                ),
                [
                  t.memberExpression(
                    t.memberExpression(
                      t.thisExpression(),
                      t.identifier("state")
                    ),
                    t.identifier("id")
                  ),
                  t.memberExpression(
                    t.memberExpression(
                      t.thisExpression(),
                      t.identifier("state")
                    ),
                    t.identifier("readOnly")
                  ),
                ]
              )
            ),
          ]),
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.thisExpression(),
                  t.identifier("changeOpen")
                ),
                [t.identifier("false")]
              )
            ),
          ])
        );

        // 预想替换整个 node 结果总是报数组越界
        // 因项目进度紧张 采用单个替换
        // path.replaceWith(
        //   t.classProperty(
        //     t.identifier("actionDone"),
        //     t.arrowFunctionExpression(
        //       [],
        //       t.blockStatement([
        //         // const declarator
        //         t.variableDeclaration("const", [
        //           t.variableDeclarator(
        //             t.objectPattern([
        //               t.objectProperty(
        //                 t.identifier("parent"),
        //                 t.identifier("parent")
        //               ),
        //             ]),
        //             t.memberExpression(
        //               t.thisExpression(),
        //               t.identifier("props")
        //             )
        //           ),
        //         ]),
        //         // if statement
        //         t.ifStatement(
        //           t.memberExpression(
        //             t.memberExpression(
        //               t.identifier("parent"),
        //               t.identifier("tableView")
        //             ),
        //             t.identifier("refresh")
        //           ),
        //           t.blockStatement([
        //             t.expressionStatement(
        //               t.callExpression(
        //                 t.memberExpression(
        //                   t.memberExpression(
        //                     t.identifier("parent"),
        //                     t.identifier("tableView")
        //                   ),
        //                   t.identifier("refresh")
        //                 ),
        //                 []
        //               )
        //             ),
        //           ])
        //         ),
        //       ])
        //     )
        //   )
        // );
      }
    },
    /**
     * 将 show 方法中的 this.setState({ // ... }) 
     * 
     * To
     * 
     * this.setState({ // ..., initLoading: false })
     *
     */ 
    enter(path) {
      if (path.node.type === "ClassMethod" && path.node.key.name === "show") {
        const target =
          path.node.body.body[0].alternate?.body[0].expression.arguments[0]
            .properties;
        if (
          path.node.body.body[0].alternate &&
          path.node.body.body[0].alternate.body
        ) {
          path.node.body.body[0].alternate.body[0].expression.arguments[0].properties =
            [
              ...target,
              t.objectProperty(
                t.stringLiteral("initLoading"),
                t.booleanLiteral(false)
              ),
            ];
        }
      }
      /**
       * 将 getDetail 中的 this.setState({ // ... , initLoading: true, // ... })
       * 
       * To
       * 
       * this.setState({ //... , // ... })
       */
      if (
        path.node.type === "ClassProperty" &&
        path.node.key.name === "getDetail"
      ) {
        const target =
          path.node.value.body.body[0].expression.arguments[0].properties;
        const idx = [...target].findIndex(
          (el) => el.key.name === "initLoading"
        );
        target.splice(idx, 1);
      }
    }
  });

  const outCode = generate(fileAST, {});
  const prettierCode = prettier.format(outCode.code, {
    // 路径为本人当前开发路径
    ...JSON.parse(fs.readFileSync("../xiyue/.prettierrc", "utf-8")),
    parser: "typescript",
  });

  fs.writeFile(filePath, prettierCode, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  });
}

// 路径为本人当前开发路径
readFile("../xiyue/src/views", () => {
  console.log(module2PropKey);
});
