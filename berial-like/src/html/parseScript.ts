/* 匹配 script 标签中的属性 */
const ANY_OR_NO_PROPERTY = /["'=\w\s]*/
/* ---------- 当使用构造函数创造正则对象时，需要常规的字符转义规则（在前面加反斜杠 \）------------ */
/* 匹配 script 标签中 src 的值 */
const SCRIPT_URL_RE = new RegExp(
  `<script${ANY_OR_NO_PROPERTY.source}(?:src="(.+?)")${ANY_OR_NO_PROPERTY.source}(?:\/>|>[\\s]*<\/script>)?`,
  'g'
)
/* 匹配 script 标签中 content 的值 */
const SCRIPT_CONTENT_RE = new RegExp(
  `<script${ANY_OR_NO_PROPERTY.source}>([\\w\\W]+?)</script>`,
  'g'
)

export default function parseScript(template: string) {
  const scriptURLs: string[] = []
  const scripts: string[] = []
  let match

  while ((match = SCRIPT_URL_RE.exec(template))) {
    /**
     * 形如 '<script src="      "></script>' 是可以被捕获的
     * 所以需要 trim 判断
     */
    const captured = match[1].trim()
    if (!captured) continue
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
