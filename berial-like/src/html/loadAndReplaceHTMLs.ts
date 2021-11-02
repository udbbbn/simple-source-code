import { fetchURL } from '../utils/fetch'
import { REPLACED_BY_BERIAL_LIKE } from '../constants'
import { SCRIPT_ANY_RE, SCRIPT_URL_RE } from './parseScript'

const loadedHTMLs: Record<
  string,
  {
    originalTemplate: string
    replacedTemplate: string
  }
> = {}

export const getLoadedHTMLs = () => loadedHTMLs

interface ToBeLoaded {
  name: string
  url: string
}

/**
 * 加载 html 并替换 script 标签
 * 在 loadScript 中已经处理 script 标签了
 * 这里需要替换掉 避免重复加载
 */
async function loadAndReplaceHTMLs(toBeLoaded: ToBeLoaded[]) {
  for (const item of toBeLoaded) {
    const originalTemplate = await fetchURL(item.url)
    loadedHTMLs[item.name] = {
      originalTemplate,
      replacedTemplate: replaceTemplate(originalTemplate),
    }
  }
  return loadedHTMLs
}

/**
 * replaceTemplate(`
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
function replaceTemplate(template: string) {
  return template.replace(SCRIPT_ANY_RE, scriptReplacer)
}

function scriptReplacer(substring: string) {
  const matchedURL = SCRIPT_URL_RE.exec(substring)
  if (matchedURL) {
    return `<!-- ${REPLACED_BY_BERIAL_LIKE} Original script: ${matchedURL[1]} -->`
  }
  return `<!-- ${REPLACED_BY_BERIAL_LIKE} Original script: inline script -->`
}

export default loadAndReplaceHTMLs
