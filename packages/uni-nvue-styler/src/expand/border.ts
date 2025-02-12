import { createDecl, NormalizeOptions, TransformDecl } from '../utils'

const borderWidth = __NODE_JS__ ? '-width' : 'Width'
const borderStyle = __NODE_JS__ ? '-style' : 'Style'
const borderColor = __NODE_JS__ ? '-color' : 'Color'

export function createTransformBorder(
  options: NormalizeOptions
): TransformDecl {
  return (decl) => {
    const { prop, value, important, raws, source } = decl
    const splitResult = value.replace(/\s*,\s*/g, ',').split(/\s+/)
    const result = [
      /^[\d\.]+\S*|^(thin|medium|thick)$/,
      /^(solid|dashed|dotted|none)$/,
      /\S+/,
    ].map((item) => {
      const index = splitResult.findIndex((str) => item.test(str))
      return index < 0 ? null : splitResult.splice(index, 1)[0]
    })
    if (splitResult.length) {
      return [decl]
    }
    return [
      createDecl(
        prop + borderWidth,
        (result[0] || (options.type === 'uvue' ? 'medium' : '0')).trim(),
        important,
        raws,
        source
      ),
      createDecl(
        prop + borderStyle,
        (result[1] || (options.type === 'uvue' ? 'none' : 'solid')).trim(),
        important,
        raws,
        source
      ),
      createDecl(
        prop + borderColor,
        (result[2] || '#000000').trim(),
        important,
        raws,
        source
      ),
    ]
  }
}
