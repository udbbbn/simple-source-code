import { request } from 'src/utils'
import { MATCH_ANY_OR_NO_PROPERTY, TEST_URL_RE } from './parseScript'

const MATCH_NONE_QUOTE_MARK = /[^"]/

/* 匹配Css link 标签中 href 的值 */
const CSS_URL_RE = new RegExp(
  `<\\s*link[^>]*href="(${MATCH_NONE_QUOTE_MARK.source}+.css${MATCH_NONE_QUOTE_MARK.source}*)"${MATCH_ANY_OR_NO_PROPERTY.source}>(?:\\s*<\\s*\/link>)?`,
  'g'
)

/* 匹配 Style 标签 */
const STYLE_RE = /<\s*style\s*>([^<]*)<\s*\/style>/g

export default async function loadCSS(template: string) {
  const { cssURLs, styles } = parseCSS(template)
  const fetchStyles = await Promise.all(cssURLs.map((url) => request(url)))
  return toStyleNode(fetchStyles.concat(styles))
}

function toStyleNode(styles: string[]) {
  return styles.map((style) => {
    const styleNode = document.createElement('style')
    styleNode.appendChild(document.createTextNode(style))
    return styleNode
  })
}

function parseCSS(template: string) {
  const cssURLs: string[] = []
  const styles: string[] = []
  let match

  while ((match = CSS_URL_RE.exec(template))) {
    let captured = match[1].trim()
    if (!captured) continue
    if (!TEST_URL_RE.test(captured)) {
      captured = window.location.origin + captured
    }
    cssURLs.push(captured)
  }

  while ((match = STYLE_RE.exec(template))) {
    const captured = match[1].trim()
    if (!captured) continue
    styles.push(captured)
  }

  return {
    cssURLs,
    styles,
  }
}
