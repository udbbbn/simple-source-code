import { REPLACED_BY_BERIAL_LIKE } from '../constants'
import { SCRIPT_ANY_RE, SCRIPT_URL_RE } from './parseScript'

/* 匹配 body content */
const BODY_CONTENT_RE = /<\s*body[^>]*>([\w\W]*)<\s*\/body>/

/**
 * replace(`
 * <html lang="en">
 *  <script src="../dist/umd/index.js"></script>
 *  <script>
 *    console.log('inline script')
 *  </script>
 * </html>`)
 *
 * result:
 * '<html lang="en">\n
 *    <\!-- Script replaced by Berial-Like. Original script: ../dist/umd/index.js -->\n
 *    <\!-- Script replaced by Berial-Like. Original script: inline script -->\n</html>'
 */
function scriptReplacer(substring: string) {
  const matchedURL = SCRIPT_URL_RE.exec(substring)
  if (matchedURL) {
    return `<!-- ${REPLACED_BY_BERIAL_LIKE} Original script: ${matchedURL[1]} -->`
  }
  return `<!-- ${REPLACED_BY_BERIAL_LIKE} Original script: inline script -->`
}

export default function loadBody(template: string) {
  let bodyContent = template.match(BODY_CONTENT_RE)?.[1] ?? ''
  bodyContent = bodyContent.replace(SCRIPT_ANY_RE, scriptReplacer)
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(bodyContent))
  return div
}
