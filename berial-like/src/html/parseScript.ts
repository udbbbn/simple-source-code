/* 匹配 script 标签中的属性 */
const MATCH_ANY_OR_NO_PROPERTY = /["'=\w\s/]*/
/* ---------- 当使用构造函数创造正则对象时，需要常规的字符转义规则（在前面加反斜杠 \）------------ */
/* 匹配 script 标签中 src 的值 */
export const SCRIPT_URL_RE = new RegExp(
  `<\\s*script${MATCH_ANY_OR_NO_PROPERTY.source}(?:src="(.+?)")${MATCH_ANY_OR_NO_PROPERTY.source}(?:\/>|>[\\s]*<\\s*\/script>)?`,
  'g'
)
/* 匹配 script 标签中 content 的值 */
export const SCRIPT_CONTENT_RE = new RegExp(
  `<\\s*script${MATCH_ANY_OR_NO_PROPERTY.source}>([\\w\\W]+?)<\\s*\/script>`,
  'g'
)
/* 匹配 script 标签 */
export const SCRIPT_ANY_RE = /<script[^>]*>[\s\S]*?(?:<\s*\/script[^>]*>)/g
/* 匹配是否为绝对路径域名 */
const TEST_URL_RE = /(?:https?):\/\/[-a-zA-Z0-9.]+/

export default function parseScript(template: string) {
  const scriptURLs: string[] = []
  const scripts: string[] = []
  let match

  while ((match = SCRIPT_URL_RE.exec(template))) {
    /**
     * 形如 '<script src="      "></script>' 是可以被捕获的
     * 所以需要 trim 判断
     */
    let captured = match[1].trim()
    if (!captured) continue
    /* 相对路径转绝对路径 */
    if (!TEST_URL_RE.test(captured)) {
      captured = window.location.origin + captured
    }
    scriptURLs.push(captured)
  }

  while ((match = SCRIPT_CONTENT_RE.exec(template))) {
    const captured = match[1].trim()
    if (!captured) continue
    scripts.push(captured)
  }

  return {
    scriptURLs,
    scripts,
  }
}
